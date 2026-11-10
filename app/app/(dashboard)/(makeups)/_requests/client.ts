import type { PaginatedMakeupRequests } from "../_domain/types";
import {
  getMakeupRequest as getRequest,
  listMakeupRequests as listRequests,
  listParentMakeupRequests,
} from "./queries";

export async function listMakeupRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedMakeupRequests> {
  return listRequests(params as never) as never;
}

export async function getMakeupRequest(id: string) {
  return getRequest(id);
}

export async function listMakeupRequestsForParent(params?: { page?: number; limit?: number }) {
  return listParentMakeupRequests(params);
}
