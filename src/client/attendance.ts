/**
 * Thin client data-access layer for Attendance.
 *
 * Names reconcile 1:1 with `src/server/attendance/{queries,actions}.ts`.
 */

import {
  markAttendance as serverMarkAttendance,
  updateAttendance as serverUpdateAttendance,
} from "@/server/attendance/actions";
import {
  listAttendance as serverListAttendance,
  siblingParticipationReport as serverSiblingParticipationReport,
  studentAttendanceSummary as serverStudentAttendanceSummary,
} from "@/server/attendance/queries";

export type {
  AbsenceReason,
  AttendanceRecentEntry,
  AttendanceStatus,
  AttendanceSummary,
  ListAttendanceQuery,
  MarkAttendanceInput,
  SessionForDay,
  SiblingParticipationReportItem,
  StudentAttendanceOverview,
  UpdateAttendanceInput,
} from "@/server/attendance/service";

export async function listAttendance(
  params?: import("@/server/attendance/service").ListAttendanceQuery,
) {
  return serverListAttendance(params);
}

export async function getAttendanceSummary(studentId: string) {
  return serverStudentAttendanceSummary(studentId);
}

export async function getSiblingParticipationReport(query: {
  date_from?: string;
  date_to?: string;
  site_id?: string;
}) {
  return serverSiblingParticipationReport(query);
}

export async function updateAttendance(payload: {
  id: string;
  status: import("@/server/attendance/service").AttendanceStatus;
  late_minutes?: number | null;
  reason?: import("@/server/attendance/service").AbsenceReason;
  reason_text?: string;
}) {
  const { id, ...input } = payload;
  return serverUpdateAttendance(id, input as never);
}

export async function markAttendance(
  input: Omit<import("@/server/attendance/service").MarkAttendanceInput, "marked_by">,
) {
  return serverMarkAttendance(input);
}
