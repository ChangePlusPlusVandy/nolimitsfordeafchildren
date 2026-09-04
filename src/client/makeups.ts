/**
 * Thin client data-access layer for Make-Up requests & sessions.
 *
 * Names reconcile 1:1 with `src/server/makeups/{queries,actions}.ts`.
 */

import {
  createMakeupRequest as serverCreateMakeupRequest,
  createMakeupSession as serverCreateMakeupSession,
  markMakeupSessionAttendance as serverMarkMakeupSessionAttendance,
  reviewMakeupRequest as serverReviewMakeupRequest,
} from "@/server/makeups/actions";
import {
  getMakeupRequest as serverGetMakeupRequest,
  listMakeupRequests as serverListMakeupRequests,
  listParentMakeupRequests as serverListParentMakeupRequests,
  listTeacherMakeupSessions as serverListTeacherMakeupSessions,
} from "@/server/makeups/queries";

export type {
  CreateMakeupRequestInput,
  CreateMakeupSessionInput,
} from "@/server/makeups/service";

export type RequestStatus = "pending" | "approved" | "denied" | "completed";

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

export async function listMakeupRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedMakeupRequests> {
  return serverListMakeupRequests(params as never) as never;
}

export async function getMakeupRequest(id: string) {
  return serverGetMakeupRequest(id);
}

export async function listMakeupSessionsForTeacher(
  teacherId: string,
  params?: { date?: string; page?: number; limit?: number },
) {
  return serverListTeacherMakeupSessions(teacherId, params ?? {});
}

export async function listMakeupRequestsForParent(params?: { page?: number; limit?: number }) {
  return serverListParentMakeupRequests(params);
}

export async function createMakeupRequest(
  input: Omit<import("@/server/makeups/service").CreateMakeupRequestInput, "requested_by">,
) {
  return serverCreateMakeupRequest(input);
}

export async function reviewMakeupRequest(
  id: string,
  input: { status: "approved" | "denied"; review_notes?: string },
) {
  return serverReviewMakeupRequest(id, input);
}

export async function createMakeupSession(
  input: Omit<import("@/server/makeups/service").CreateMakeupSessionInput, "created_by">,
) {
  return serverCreateMakeupSession(input);
}

export async function markMakeupSessionAttendance(
  sessionId: string,
  input: { status: "present" | "late" | "no_show" | "cancelled" },
) {
  return serverMarkMakeupSessionAttendance(sessionId, input);
}
