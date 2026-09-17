"use server";
import {
  type AttendanceStatus,
  attendanceService,
  type ListAttendanceQuery,
} from "@/server/attendance/service";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";
import { assertCanAccessStudent } from "@/server/shared/student-access";

export async function listAttendance(query: ListAttendanceQuery = {}) {
  const user = await requireRole("administrator", "teacher", "parent");
  if (user.role !== "administrator") {
    if (!query.student_id) {
      throw new BadRequestError("student_id is required");
    }
    await assertCanAccessStudent(user, query.student_id);
  }
  return await attendanceService.index(query);
}

export async function showAttendance(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const result = await attendanceService.show(id);
  if (!result) {
    throw new NotFoundError("Attendance record not found");
  }
  await assertCanAccessStudent(user, result.student_id);
  return result;
}

export async function studentAttendanceSummary(studentId: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  await assertCanAccessStudent(user, studentId);
  return await attendanceService.getSummary(studentId);
}

export async function getAttendanceSummary(studentId: string) {
  return await studentAttendanceSummary(studentId);
}

export async function siblingParticipationReport(
  query: { date_from?: string; date_to?: string; site_id?: string } = {},
) {
  await requireRole("administrator");
  return await attendanceService.getSiblingParticipationReport(query);
}

export type { AttendanceStatus };
