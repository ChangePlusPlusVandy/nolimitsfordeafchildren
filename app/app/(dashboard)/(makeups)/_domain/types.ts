import type { RequestStatus as SchemaRequestStatus } from "@/_platform/db/schema";

export type { CreateMakeupRequestInput, AbsenceReason } from "../_request/types";
export type { CreateMakeupSessionInput } from "../_schedule-session/types";
export type { AttendanceStatus, MakeupSessionWithDetails } from "../_teacher-sessions/types";

export type RequestStatus = Exclude<SchemaRequestStatus, "negotiating">;

export type MakeupRequestWithDetails = {
  id: string;
  student_id: string;
  requested_by: string;
  original_schedule_id: string;
  original_session_date: string;
  reason: string;
  status: RequestStatus;
  admin_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
  original_schedule?: {
    id: string;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    site: { id: string; name: string };
  };
  requested_by_user?: {
    id: string;
    name: string;
    email: string;
  };
};

export interface PaginatedMakeupRequests {
  items: MakeupRequestWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
