export type AttendanceStatus = "present" | "late" | "no_show" | "cancelled";
export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

export interface MarkAttendanceInput {
  student_id: string;
  schedule_id: string;
  session_date: string;
  status: AttendanceStatus;
  late_minutes?: number;
  reason?: AbsenceReason;
  reason_text?: string;
  sibling_participant_ids?: string[];
  marked_by: string;
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  late_minutes?: number | null;
  reason?: AbsenceReason | null;
  reason_text?: string | null;
  sibling_participant_ids?: string[];
}

export interface ListAttendanceQuery {
  student_id?: string;
  schedule_id?: string;
  teacher_id?: string;
  site_id?: string;
  date_from?: string;
  date_to?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  no_show: number;
  cancelled: number;
  attendance_rate: number;
}

export interface AttendanceRecentEntry {
  id: string;
  session_date: string;
  status: AttendanceStatus;
  late_minutes: number | null;
  reason: AbsenceReason | null;
  reason_text: string | null;
  marked_at: Date;
  schedule_id: string;
  marked_by: {
    id: string;
    name: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  } | null;
}

export interface StudentAttendanceOverview {
  total: number;
  present: number;
  late: number;
  no_show: number;
  cancelled: number;
  attendance_rate: number;
  recent_entries: AttendanceRecentEntry[];
}

export interface SessionForDay {
  session_date: string;
  schedule_id: string;
  student_id: string;
  student_initials: string;
  student_first_name: string;
  student_last_name: string;
  start_time: string;
  end_time: string;
  site_id: string;
  site_name: string;
  attendance?: {
    id: string;
    status: AttendanceStatus;
    late_minutes: number | null;
    reason: AbsenceReason | null;
    reason_text: string | null;
    marked_at: Date;
    sibling_participants?: Array<{
      sibling_id: string;
      name: string;
      relationship: string;
    }>;
  } | null;
}

export interface SiblingParticipationReportItem {
  sibling_id: string;
  sibling_name: string;
  student_id: string;
  student_initials: string;
  site_id: string;
  site_name: string;
  total_sessions: number;
  present_sessions: number;
}
