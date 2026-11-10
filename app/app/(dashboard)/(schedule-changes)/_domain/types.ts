import type { RequestStatus } from "@/_platform/db/schema";

import type { ScheduleInfo } from "../_requests/types";

export type { RequestStatus, ScheduleInfo };
export type { CreateScheduleChangeInput } from "../_request/types";
export type { TeacherScheduleChangeResponseInput } from "../_teacher-response/types";

export type ScheduleChangeRequestWithDetails = {
  id: string;
  student_id: string;
  requested_by: string;
  current_schedule_id: string;
  requested_schedule_id: string;
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
  current_schedule?: ScheduleInfo;
  requested_schedule?: ScheduleInfo;
  requested_by_user?: {
    id: string;
    name: string;
    email: string;
  };
};

export interface PaginatedScheduleChangeRequests {
  items: ScheduleChangeRequestWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
