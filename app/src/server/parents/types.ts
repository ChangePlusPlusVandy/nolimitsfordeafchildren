import type { PaginatedQuery, PaginatedResponse } from "@/server/shared/pagination";

export type AudiogramComplianceStatus = "overdue" | "due_soon" | "up_to_date" | "unknown";

export interface AudiogramCompliance {
  status: AudiogramComplianceStatus;
  next_due_date: string | null;
}

export interface LinkedChild {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  photo_url: string | null;
  dob: string;
  site: {
    id: string;
    name: string;
  };
  current_schedule_id: string | null;
  next_session?: {
    date: string;
    time: string;
    teacher_name: string;
  } | null;
  attendance_summary: {
    total: number;
    present: number;
    attendance_rate: number;
  };
  pending_requests: number;
  audiogram_compliance: AudiogramCompliance;
}

export interface ChildScheduleSession {
  schedule_id: string;
  date: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  teacher: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
  attendance_status?: "present" | "late" | "no_show" | "cancelled" | null;
}

export interface ChildDetails {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  photo_url: string | null;
  dob: string;
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
  current_school: string | null;
  site: {
    id: string;
    name: string;
  };
  upcoming_sessions: ChildScheduleSession[];
  recent_sessions: ChildScheduleSession[];
  attendance_summary: {
    total: number;
    present: number;
    no_show: number;
    cancelled: number;
    attendance_rate: number;
  };
  pending_makeup_requests: number;
  pending_schedule_change_requests: number;
  missed_sessions: Array<{
    schedule_id: string;
    date: string;
    reason: string | null;
    can_request_makeup: boolean;
  }>;
  relevant_bulletins: Array<{
    id: string;
    title: string;
    body: string | null;
    publish_at: Date | null;
  }>;
  approved_documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    file_url: string;
    created_at: Date;
    review_status: "approved" | "pending" | "rejected";
    session_date: string | null;
    next_due_date: string | null;
  }>;
  audiogram_compliance: AudiogramCompliance;
  siblings: Array<{
    id: string;
    name: string;
    age: number | null;
    relationship: string;
    is_participant: boolean;
    has_hearing_loss: boolean;
  }>;
}

export interface DirectoryPerson {
  id: string;
  role: "administrator" | "teacher";
  name: string;
  email: string;
  bio: string | null;
  photo_url: string | null;
}

export interface ParentZipReportItem {
  parent_user_id: string;
  parent_name: string;
  parent_email: string;
  postal_code: string;
  city: string | null;
  state: string | null;
  linked_students: number;
}

export interface ParentZipReportGroup {
  postal_code: string;
  parent_count: number;
  student_count: number;
  parents: ParentZipReportItem[];
}

export type { PaginatedQuery, PaginatedResponse };
