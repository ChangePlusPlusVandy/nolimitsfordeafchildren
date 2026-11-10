"use server";

import { z } from "zod";

import { assertTeacherCanMarkStudentSchedule } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import {
  type ClearAttendanceInput,
  type MarkAttendanceInput,
  type UpdateAttendanceInput,
} from "../_domain/types";
import { showAttendanceRecord } from "../_records/service";
import {
  clearAttendance as clearRecord,
  markAttendance as markRecord,
  updateAttendance as updateRecord,
} from "./service";

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

const clearAttendanceSchema = markAttendanceSchema.pick({
  student_id: true,
  schedule_id: true,
  session_date: true,
});

export async function clearAttendance(input: ClearAttendanceInput) {
  const currentUser = await requireRole("teacher", "administrator");
  const parsed = clearAttendanceSchema.parse(input);

  if (currentUser.role === "teacher") {
    await assertTeacherCanMarkStudentSchedule(
      currentUser.id,
      parsed.student_id,
      parsed.schedule_id,
    );
  }

  await clearRecord(parsed);
}

export async function markAttendance(input: Omit<MarkAttendanceInput, "marked_by">) {
  const currentUser = await requireRole("teacher", "administrator");
  const parsed = markAttendanceSchema.parse(input) as Omit<MarkAttendanceInput, "marked_by">;

  if (currentUser.role === "teacher") {
    await assertTeacherCanMarkStudentSchedule(
      currentUser.id,
      parsed.student_id,
      parsed.schedule_id,
    );
  }

  return await markRecord({
    ...parsed,
    marked_by: currentUser.id,
  });
}

export async function updateAttendance(id: string, input: UpdateAttendanceInput) {
  const currentUser = await requireRole("teacher", "administrator");
  const parsed = updateAttendanceSchema.parse(input) as UpdateAttendanceInput;

  if (currentUser.role === "teacher") {
    const existing = await showAttendanceRecord(id);
    if (!existing) {
      throw new NotFoundError("Attendance record not found");
    }
    await assertTeacherCanMarkStudentSchedule(
      currentUser.id,
      existing.student_id,
      existing.schedule_id,
    );
  }

  const result = await updateRecord(id, parsed, currentUser.id);
  if (!result) {
    throw new NotFoundError("Attendance record not found");
  }
  return result;
}
