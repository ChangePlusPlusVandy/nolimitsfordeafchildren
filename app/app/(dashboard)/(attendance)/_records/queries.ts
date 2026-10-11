"use server";
import { assertCanAccessStudent } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError, NotFoundError } from "@/_shared/server/errors";

import { type AttendanceStatus, type ListAttendanceQuery } from "../_domain/types";
import {
  getAttendanceSummary as getSummary,
  listAttendanceRecords,
  showAttendanceRecord,
} from "./service";

export async function listAttendance(query: ListAttendanceQuery = {}) {
  const user = await requireRole("administrator", "teacher", "parent");
  if (user.role !== "administrator") {
    if (!query.student_id) {
      throw new BadRequestError("student_id is required");
    }
    await assertCanAccessStudent(user, query.student_id);
  }
  return await listAttendanceRecords(query);
}

export async function showAttendance(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const result = await showAttendanceRecord(id);
  if (!result) {
    throw new NotFoundError("Attendance record not found");
  }
  await assertCanAccessStudent(user, result.student_id);
  return result;
}

export async function studentAttendanceSummary(studentId: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  await assertCanAccessStudent(user, studentId);
  return await getSummary(studentId);
}

export async function getAttendanceSummary(studentId: string) {
  return await studentAttendanceSummary(studentId);
}

export type { AttendanceStatus };
