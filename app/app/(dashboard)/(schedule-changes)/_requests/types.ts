import type { RequestStatus, ScheduleChangeRequestEntity } from "@/_platform/db/schema";

export interface ScheduleInfo {
  id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  site: { id: string; name: string };
  teacher: { id: string; name: string };
}

export interface ScheduleChangeRequestWithDetails extends ScheduleChangeRequestEntity {
  student?: { id: string; initials: string; first_name: string; last_name: string };
  current_schedule?: ScheduleInfo;
  requested_schedule?: ScheduleInfo;
  requested_by_user?: { id: string; name: string };
  reviewed_by_user?: { id: string; name: string } | null;
  events?: Array<{
    id: string;
    event_type: string;
    from_status: string | null;
    to_status: string | null;
    notes: string | null;
    created_at: Date;
    actor_user: {
      id: string;
      name: string;
      role: "administrator" | "teacher" | "parent" | "unassigned";
    };
  }>;
  preferred_times: string | null;
  flexibility_notes: string | null;
  teacher_response_status: string | null;
  teacher_response_notes: string | null;
  teacher_responded_by: string | null;
  teacher_responded_at: Date | null;
}

export interface ListRequestsFilters {
  status?: RequestStatus;
  student_id?: string;
  site_id?: string;
  page?: number;
  limit?: number;
  teacher_profile_id?: string;
  student_ids?: string[];
}
