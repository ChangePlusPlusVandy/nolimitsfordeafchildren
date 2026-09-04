import {
  AttendanceService,
  type AttendanceStatus,
  type ListAttendanceQuery,
} from "@/server/attendance/service";
import { requireRole } from "@/server/shared/auth-guard";

/**
 * GET /v1/attendance — list attendance records (any authenticated user).
 */
export async function listAttendance(query: ListAttendanceQuery = {}) {
  await requireRole();
  return await new AttendanceService().index(query);
}

/**
 * GET /v1/attendance/:id — single record (any authenticated user).
 */
export async function showAttendance(id: string) {
  await requireRole();
  const result = await new AttendanceService().show(id);
  if (!result) {
    throw new Error("Attendance record not found");
  }
  return result;
}

/**
 * GET /v1/students/:id/attendance/summary — any authenticated user.
 */
export async function studentAttendanceSummary(studentId: string) {
  await requireRole();
  return await new AttendanceService().getSummary(studentId);
}

/**
 * Client-facing alias (src/client/attendance.ts imports this name).
 */
export async function getAttendanceSummary(studentId: string) {
  return await studentAttendanceSummary(studentId);
}

/**
 * GET /v1/attendance/sibling-participation-report — admin only.
 */
export async function siblingParticipationReport(
  query: { date_from?: string; date_to?: string; site_id?: string } = {},
) {
  await requireRole("administrator");
  return await new AttendanceService().getSiblingParticipationReport(query);
}

export type { AttendanceStatus };
