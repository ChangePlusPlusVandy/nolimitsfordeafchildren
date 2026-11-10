import type { PaginatedScheduleChangeRequests } from "../_domain/types";
import {
  getScheduleChangeRequest as getRequest,
  listScheduleChangeRequests as listRequests,
  listParentScheduleChangeRequests,
} from "./queries";

export async function listScheduleChangeRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedScheduleChangeRequests> {
  return listRequests(params as never) as never;
}

export async function getScheduleChangeRequest(id: string) {
  return getRequest(id);
}

export async function listScheduleChangeRequestsForParent(params?: {
  page?: number;
  limit?: number;
}) {
  return listParentScheduleChangeRequests(params);
}
