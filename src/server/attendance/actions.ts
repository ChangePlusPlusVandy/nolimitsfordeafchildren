"use server";

import { z } from "zod";
import {
  attendanceService,
  type MarkAttendanceInput,
  type UpdateAttendanceInput,
} from "@/server/attendance/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

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
    late_minutes: z.number().int().nullable().optional(),
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

export async function markAttendance(input: Omit<MarkAttendanceInput, "marked_by">) {
  const currentUser = await requireRole("teacher", "administrator");
  const parsed = markAttendanceSchema.parse(input) as Omit<MarkAttendanceInput, "marked_by">;

  return await attendanceService.mark({
    ...parsed,
    marked_by: currentUser.id,
  });
}

export async function updateAttendance(id: string, input: UpdateAttendanceInput) {
  const currentUser = await requireRole("teacher", "administrator");
  const parsed = updateAttendanceSchema.parse(input) as UpdateAttendanceInput;

  const result = await attendanceService.update(id, parsed, currentUser.id);
  if (!result) {
    throw new NotFoundError("Attendance record not found");
  }
  return result;
}
