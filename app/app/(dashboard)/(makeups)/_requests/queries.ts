"use server";

import { requireRole } from "@/_platform/auth/guard";
import { HttpError } from "@/_shared/server/errors";

import type { RequestStatus } from "../_domain/types";
import { MakeupRequests } from "./service";

export async function listMakeupRequests(
  query: {
    status?: RequestStatus;
    student_id?: string;
    site_id?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  await requireRole("administrator");
  return await new MakeupRequests().listRequests(query);
}

export async function getMakeupRequest(id: string) {
  const currentUser = await requireRole("administrator", "parent");

  if (currentUser.role === "parent") {
    const canView = await new MakeupRequests().isRequestVisibleToParent(id, currentUser.id);
    if (!canView) {
      throw new HttpError(404, "NOT_FOUND", "Makeup request not found");
    }
  }

  const request = await new MakeupRequests().showRequest(id);
  if (!request) {
    throw new HttpError(404, "NOT_FOUND", "Makeup request not found");
  }
  return request;
}

export async function listParentMakeupRequests(query: { page?: number; limit?: number } = {}) {
  const currentUser = await requireRole("parent");
  return await new MakeupRequests().listRequestsForParent(currentUser.id, query);
}

export async function listMakeupRequestsForParent(query: { page?: number; limit?: number } = {}) {
  return await listParentMakeupRequests(query);
}
