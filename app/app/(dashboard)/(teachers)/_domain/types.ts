import type {
  AgeGroupSpecialty,
  ScheduleEntity,
  TeacherProfileEntity,
} from "@/_platform/db/schema";

export type { AgeGroupSpecialty };
export type {
  CreateScheduleInput,
  UpdateScheduleInput,
} from "@/(dashboard)/(schedules)/_domain/types";

export interface ListTeachersQuery {
  search?: string;
  specialty?: AgeGroupSpecialty;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "created_at";
  order?: "asc" | "desc";
}

export interface CreateTeacherInput {
  user_id: string;
  primary_site_id?: string;
  bio?: string;
  photo_url?: string;
  qualifications?: string;
  credentials?: string;
  age_group_specialty?: AgeGroupSpecialty;
}

export interface UpdateTeacherInput {
  primary_site_id?: string;
  bio?: string;
  photo_url?: string;
  qualifications?: string;
  credentials?: string;
  age_group_specialty?: AgeGroupSpecialty;
}

export interface TeacherWithUser extends TeacherProfileEntity {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
  };
  primarySite?: {
    id: string;
    name: string;
  } | null;
}

export interface TeacherDetailsRecord extends TeacherWithUser {
  locations: Array<{ id: string; name: string }>;
  schedules: Array<ScheduleEntity & { site: { id: string; name: string } }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    site: { id: string; name: string };
  }>;
}

export interface Teacher {
  id: string;
  user_id: string;
  primary_site_id: string | null;
  bio: string | null;
  photo_url: string | null;
  qualifications: string | null;
  credentials: string | null;
  age_group_specialty: AgeGroupSpecialty | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
  };
  primarySite?: { id: string; name: string } | null;
}

export interface TeacherDetails extends Teacher {
  locations: Array<{ id: string; name: string }>;
  schedules: Array<{
    id: string;
    teacher_id: string;
    site_id: string;
    session_id: string | null;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
    is_active: boolean;
    site: { id: string; name: string };
    session?: { id: string; name: string } | null;
  }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    site: { id: string; name: string };
  }>;
}

export interface ListTeachersResponse {
  items: Teacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AttendanceStatus = "present" | "late" | "no_show" | "cancelled";
export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

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
    late_minutes?: number | null;
    reason: AbsenceReason | null;
    reason_text: string | null;
    marked_at: string;
    sibling_participants?: Array<{
      sibling_id: string;
      name: string;
      relationship: string;
    }>;
  } | null;
}

export interface MyDayResponse {
  sessions: SessionForDay[];
}

export interface Schedule {
  id: string;
  teacher_id: string;
  site_id: string;
  session_id: string | null;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
