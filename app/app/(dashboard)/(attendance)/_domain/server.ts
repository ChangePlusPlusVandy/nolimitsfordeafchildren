import type { AttendanceEntity } from "@/_platform/db/schema";

import { clearAttendance, markAttendance, updateAttendance } from "../_mark/service";
import { getTeacherDaySessions, getTeacherSessionsInRange } from "../_my-day/service";
import {
  getAttendanceSummary,
  listAttendanceRecords,
  showAttendanceRecord,
} from "../_records/service";
import { getSiblingParticipationReport } from "../_sibling-participation/service";
import { getStudentAttendanceOverview } from "../_student-overview/service";

export { sendNoShowAlerts } from "../_mark/alerts";
export { clearAttendance, markAttendance, updateAttendance } from "../_mark/service";
export { normalizeSiblingParticipantIds, replaceSiblingParticipants } from "../_mark/siblings";
export { getTeacherDaySessions, getTeacherSessionsInRange } from "../_my-day/service";
export {
  getAttendanceSummary,
  listAttendanceRecords,
  showAttendanceRecord,
} from "../_records/service";
export { getSiblingParticipationReport } from "../_sibling-participation/service";
export { getStudentAttendanceOverview } from "../_student-overview/service";

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

export class AttendanceService {
  clear(input: Parameters<typeof clearAttendance>[0]) {
    return clearAttendance(input);
  }

  mark(input: Parameters<typeof markAttendance>[0]) {
    return markAttendance(input);
  }

  update(id: string, input: Parameters<typeof updateAttendance>[1], markedBy: string) {
    return updateAttendance(id, input, markedBy);
  }

  index(query: Parameters<typeof listAttendanceRecords>[0]) {
    return listAttendanceRecords(query);
  }

  getSummary(studentId: string) {
    return getAttendanceSummary(studentId);
  }

  getStudentAttendanceOverview(studentId: string, recentLimit?: number) {
    return getStudentAttendanceOverview(studentId, recentLimit);
  }

  getTeacherDaySessions(teacherProfileId: string, date: string) {
    return getTeacherDaySessions(teacherProfileId, date);
  }

  getSiblingParticipationReport(query: Parameters<typeof getSiblingParticipationReport>[0]) {
    return getSiblingParticipationReport(query);
  }

  getTeacherSessionsInRange(teacherProfileId: string, startDate: string, endDate: string) {
    return getTeacherSessionsInRange(teacherProfileId, startDate, endDate);
  }

  show(id: string): Promise<AttendanceEntity | null> {
    return showAttendanceRecord(id);
  }
}

export const attendanceService = new AttendanceService();
