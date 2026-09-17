import type { AttendanceEntity } from "@/db/schema";
import { markAttendance, updateAttendance } from "@/server/attendance/mark";
import { getTeacherDaySessions, getTeacherSessionsInRange } from "@/server/attendance/myDay";
import {
  getAttendanceSummary,
  getSiblingParticipationReport,
  getStudentAttendanceOverview,
  listAttendanceRecords,
  showAttendanceRecord,
} from "@/server/attendance/reports";

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
} from "@/server/attendance/types";

export class AttendanceService {
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
