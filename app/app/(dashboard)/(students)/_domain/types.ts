export type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

export interface StudentFilters {
  search?: string;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "initials" | "created_at" | "dob";
  order?: "asc" | "desc";
}

export interface CreateStudentInput {
  site_id: string;
  first_name: string;
  last_name: string;
  initials?: string;
  photo_url?: string;
  dob: string;
  current_school?: string;
  preferred_language?: string;
  hearing_devices?: string[];
  hearing_loss_type?:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary?: string;
  initial_schedule_id?: string;
}

export interface UpdateStudentInput {
  site_id?: string;
  first_name?: string;
  last_name?: string;
  initials?: string;
  photo_url?: string;
  dob?: string;
  current_school?: string;
  preferred_language?: string;
  hearing_devices?: string[];
  hearing_loss_type?:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary?: string;
  is_active?: boolean;
}

export interface AddSiblingInput {
  name: string;
  age?: number;
  relationship: string;
  is_participant?: boolean;
  has_hearing_loss?: boolean;
  photo_url?: string;
  notes?: string;
}

export interface UpdateSiblingInput {
  name?: string;
  age?: number;
  relationship?: string;
  is_participant?: boolean;
  has_hearing_loss?: boolean;
  photo_url?: string;
  notes?: string;
}

export interface LinkTeacherInput {
  teacher_id: string;
}

export interface LinkParentInput {
  parent_id: string;
  relationship?: string;
  is_primary?: boolean;
}

export interface Student {
  id: string;
  site_id: string;
  first_name: string;
  last_name: string;
  initials: string;
  photo_url: string | null;
  dob: string;
  current_school: string | null;
  preferred_language: string;
  hearing_devices: string[];
  hearing_loss_type:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentListItem {
  id: string;
  initials: string;
  site_id: string;
  dob: string;
  is_active: boolean;
}

export interface StudentDetails extends Student {
  site: {
    id: string;
    name: string;
    type: string;
  } | null;
  active_schedules?: Array<{
    id: string;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
    session?: { id: string; name: string } | null;
    site: { id: string; name: string };
    teacher: { id: string; name: string };
  }>;
  schedule_history?: Array<{
    enrollment_id: string;
    enrolled_at: string;
    ended_at: string | null;
    is_current: boolean;
    schedule: {
      id: string;
      day_of_week_mask: number;
      start_time: string;
      end_time: string;
      cycle_start_date: string;
      cycle_end_date: string;
      is_active: boolean;
      session?: { id: string; name: string } | null;
      site: { id: string; name: string };
      teacher: { id: string; name: string };
    };
  }>;
  siblings: Sibling[];
  teachers: LinkedTeacher[];
  parents: LinkedParent[];
  attendance_overview: AttendanceOverview | null;
}

export interface AttendanceRecentEntry {
  id: string;
  session_date: string;
  status: "present" | "late" | "no_show" | "cancelled";
  late_minutes: number | null;
  reason:
    | "sick"
    | "family_emergency"
    | "transportation"
    | "schedule_conflict"
    | "no_show_unknown"
    | "other"
    | null;
  reason_text: string | null;
  marked_at: string;
  schedule_id: string;
  marked_by: {
    id: string;
    name: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  } | null;
}

export interface AttendanceOverview {
  total: number;
  present: number;
  late: number;
  no_show: number;
  cancelled: number;
  attendance_rate: number;
  recent_entries: AttendanceRecentEntry[];
}

export interface Sibling {
  id: string;
  name: string;
  age: number | null;
  relationship: string;
  is_participant: boolean;
  has_hearing_loss: boolean;
  photo_url: string | null;
  notes: string | null;
}

export interface LinkedTeacher {
  link_id: string;
  teacher_id: string;
  name: string;
  email: string;
  assigned_at: string;
}

export interface LinkableTeacher {
  id: string;
  name: string;
  email: string;
}

export interface LinkedParent {
  link_id: string;
  parent_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
  is_primary: boolean;
  linked_at: string;
}

export interface ListStudentsResponse {
  items: StudentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
