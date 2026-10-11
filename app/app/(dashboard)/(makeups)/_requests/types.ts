import type { MakeupRequestEntity } from "@/_platform/db/schema";

import type { RequestStatus } from "../_domain/types";

export interface MakeupRequestWithDetails extends MakeupRequestEntity {
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
  original_schedule?: {
    id: string;
    site_name: string;
    teacher_name: string;
  };
  requested_by_user?: {
    id: string;
    name: string;
  };
  reviewed_by_user?: {
    id: string;
    name: string;
  } | null;
  makeup_session?: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    teacher_name: string;
    site_name: string;
  } | null;
}

export interface ListMakeupRequestsFilters {
  status?: RequestStatus;
  student_id?: string;
  site_id?: string;
  page?: number;
  limit?: number;
  student_ids?: string[];
}
