"use server";

import { z } from "zod";
import {
  AttendanceService,
  type MarkAttendanceInput,
  type UpdateAttendanceInput,
} from "@/server/attendance/service";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";

const attendanceStatusSchema = z.enum(["present", "late", "no_show", "cancelled"]);
const absenceReasonSchema = z
  .enum([
    "sick",
    "family_emergency",
    "transportation",
    "schedule_conflict",
    "no_show_unknown",
    "other",
  ])
  .nullable()
  .optional();

const markAttendanceSchema = z
  .object({
    student_id: z.string().min(1),
    schedule_id: z.string().min(1),
    session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: attendanceStatusSchema,
    late_minutes: z.number().int().optional(),
    reason: absenceReasonSchema,
    reason_text: z.string().max(500).nullable().optional(),
    sibling_participant_ids: z.array(z.string()).optional(),
  })
  .passthrough();

const updateAttendanceSchema = z
  .object({
    status: attendanceStatusSchema.optional(),
    late_minutes: z.number().int().nullable().optional(),
    reason: absenceReasonSchema,
    reason_text: z.string().max(500).nullable().optional(),
    sibling_participant_ids: z.array(z.string()).optional(),
  })
  .passthrough();

/** Map the service's late-minutes constraint onto a 400 (as the controller did). */
function mapLateMinutesError(error: unknown): never {
  if (error instanceof Error && error.message.includes("Late minutes must be")) {
    throw new BadRequestError("Late minutes must be one of: 10, 15, or 30");
  }
  throw error;
}

/**
 * POST /v1/attendance — mark attendance (teacher | administrator).
 */
export async function markAttendance(input: Omit<MarkAttendanceInput, "marked_by">) {
  const currentUser = await requireRole("teacher", "administrator");
  const parsed = markAttendanceSchema.parse(input) as Omit<MarkAttendanceInput, "marked_by">;

  try {
    return await new AttendanceService().mark({
      ...parsed,
      marked_by: currentUser.id,
    });
  } catch (error) {
    mapLateMinutesError(error);
  }
}

/**
 * PATCH /v1/attendance/:id — update an attendance record
 * (teacher | administrator).
 */
export async function updateAttendance(id: string, input: UpdateAttendanceInput) {
  const currentUser = await requireRole("teacher", "administrator");
  const parsed = updateAttendanceSchema.parse(input) as UpdateAttendanceInput;

  try {
    const result = await new AttendanceService().update(id, parsed, currentUser.id);
    if (!result) {
      throw new NotFoundError("Attendance record not found");
    }
    return result;
  } catch (error) {
    mapLateMinutesError(error);
  }
}
