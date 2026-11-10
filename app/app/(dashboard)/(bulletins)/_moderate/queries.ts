"use server";

import { requireRole } from "@/_platform/auth/guard";

import { bulletinsService } from "../_domain/server";

export async function listBulletinsPending(query: { page?: number; limit?: number } = {}) {
  await requireRole("administrator");
  return await bulletinsService.listPendingApproval(query);
}

export async function getBulletinModerationPending(query: { page?: number; limit?: number } = {}) {
  return await listBulletinsPending(query);
}
