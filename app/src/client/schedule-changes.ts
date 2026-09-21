/**
 * Thin client data-access layer for Schedule Change requests and browsing
 * available schedules.
 *
 * Names reconcile 1:1 with `src/server/schedule-changes/{queries,actions}.ts`
 * and `src/server/schedules/queries.ts`.
 */

import {
  createScheduleChangeRequest as serverCreateScheduleChangeRequest,
  reviewScheduleChangeRequest as serverReviewScheduleChangeRequest,
  teacherRespond as serverTeacherRespond,
} from "@/server/schedule-changes/actions";
import {
  getScheduleChangeRequest as serverGetScheduleChangeRequest,
  listParentScheduleChangeRequests as serverListParentScheduleChangeRequests,
  listScheduleChangeRequests as serverListScheduleChangeRequests,
} from "@/server/schedule-changes/queries";
import { availableSchedules as serverAvailableSchedules } from "@/server/schedules/queries";

export type {
  CreateScheduleChangeInput,
  RequestStatus,
  ScheduleInfo,
} from "@/server/schedule-changes/service";

export type ScheduleChangeRequestWithDetails = {
  id: string;
  student_id: string;
  requested_by: string;
  current_schedule_id: string;
  requested_schedule_id: string;
  reason: string;
  status: import("@/server/schedule-changes/service").RequestStatus;
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
  current_schedule?: import("@/server/schedule-changes/service").ScheduleInfo;
  requested_schedule?: import("@/server/schedule-changes/service").ScheduleInfo;
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

/** Admins see all; teachers automatically get requests touching their schedules. */
export async function listScheduleChangeRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedScheduleChangeRequests> {
  return serverListScheduleChangeRequests(params as never) as never;
}

export async function getScheduleChangeRequest(id: string) {
  return serverGetScheduleChangeRequest(id);
}

export async function listScheduleChangeRequestsForParent(params?: {
  page?: number;
  limit?: number;
}) {
  return serverListParentScheduleChangeRequests(params);
}

export async function createScheduleChangeRequest(
  input: Omit<
    import("@/server/schedule-changes/service").CreateScheduleChangeInput,
    "requested_by"
  >,
) {
  return serverCreateScheduleChangeRequest(input);
}

/** Review a schedule change request (admin). */
export async function reviewScheduleChangeRequest(
  id: string,
  input: { status: string; review_notes?: string },
) {
  return serverReviewScheduleChangeRequest(id, {
    status: input.status,
    admin_notes: input.review_notes,
  } as never);
}

/** Teacher marking availability for a proposed new schedule. */
export async function teacherRespondToScheduleChange(
  id: string,
  input: { response_status: "available" | "unavailable" | "conditional"; notes?: string },
) {
  return serverTeacherRespond(id, input);
}

/** Browse schedules parents can request changes to. */
export async function getAvailableSchedules(params?: {
  site_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return serverAvailableSchedules(params as never);
}
