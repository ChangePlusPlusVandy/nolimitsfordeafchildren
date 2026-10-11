import {
  clearAttendance as serverClearAttendance,
  markAttendance as serverMarkAttendance,
  updateAttendance as serverUpdateAttendance,
} from "../_mark/actions";
import {
  listAttendance as serverListAttendance,
  studentAttendanceSummary as serverStudentAttendanceSummary,
} from "../_records/queries";
import { siblingParticipationReport as serverSiblingParticipationReport } from "../_sibling-participation/queries";

export type {
  AbsenceReason,
  AttendanceRecentEntry,
  AttendanceStatus,
  AttendanceSummary,
  ClearAttendanceInput,
  ListAttendanceQuery,
  MarkAttendanceInput,
  SessionForDay,
  SiblingParticipationReportItem,
  StudentAttendanceOverview,
  UpdateAttendanceInput,
} from "./types";

export async function listAttendance(params?: import("./types").ListAttendanceQuery) {
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
  status: import("./types").AttendanceStatus;
  late_minutes?: number | null;
  reason?: import("./types").AbsenceReason;
  reason_text?: string;
}) {
  const { id, ...input } = payload;
  return serverUpdateAttendance(id, input as never);
}

export async function markAttendance(
  input: Omit<import("./types").MarkAttendanceInput, "marked_by">,
) {
  return serverMarkAttendance(input);
}

export async function clearAttendance(input: import("./types").ClearAttendanceInput) {
  return serverClearAttendance(input);
}
