"use server";
import { bulletinsService, type ListBulletinsQuery } from "@/server/bulletins/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

/**
 * GET /v1/bulletins — role/site-scoped list (any authenticated user).
 */
export async function listBulletins(query: ListBulletinsQuery = {}) {
  const currentUser = await requireRole();
  return await bulletinsService.index(query, currentUser.role, currentUser.id);
}

/**
 * GET /v1/bulletins/:id — any authenticated user; records a view.
 */
export async function getBulletin(id: string) {
  const currentUser = await requireRole();
  const bulletin = await bulletinsService.show(id, currentUser.id);
  if (!bulletin) {
    throw new NotFoundError("Bulletin not found");
  }

  await bulletinsService.recordView(id, currentUser.id);

  return bulletin;
}

/**
 * GET /v1/bulletins/:id/views — view statistics (admin only).
 */
export async function getBulletinViews(id: string) {
  await requireRole("administrator");
  const bulletin = await bulletinsService.show(id);
  if (!bulletin) {
    throw new NotFoundError("Bulletin not found");
  }

  return await bulletinsService.getViewStats(id);
}

/**
 * GET /v1/bulletins/:id/acknowledgements — stats (admin only).
 */
export async function getBulletinAcknowledgements(id: string) {
  await requireRole("administrator");
  const bulletin = await bulletinsService.show(id);
  if (!bulletin) {
    throw new NotFoundError("Bulletin not found");
  }

  return await bulletinsService.getAcknowledgementStats(id);
}

/**
 * GET /v1/bulletins/moderation/pending — admin only.
 */
export async function listBulletinsPending(query: { page?: number; limit?: number } = {}) {
  await requireRole("administrator");
  return await bulletinsService.listPendingApproval(query);
}

/**
 * Client-facing aliases (src/client/bulletins.ts imports these names).
 */
export async function getBulletinViewStats(id: string) {
  return await getBulletinViews(id);
}

export async function getBulletinAcknowledgementStats(id: string) {
  return await getBulletinAcknowledgements(id);
}

export async function getBulletinModerationPending(query: { page?: number; limit?: number } = {}) {
  return await listBulletinsPending(query);
}
