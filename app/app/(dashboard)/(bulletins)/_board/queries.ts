"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { bulletinsService } from "../_domain/server";
import type { ListBulletinsQuery } from "../_domain/types";

export async function listBulletins(query: ListBulletinsQuery = {}) {
  const currentUser = await requireRole();
  return await bulletinsService.index(query, currentUser.role, currentUser.id);
}

export async function getBulletin(id: string) {
  const currentUser = await requireRole();
  const bulletin = await bulletinsService.show(id, currentUser.id);
  if (!bulletin) {
    throw new NotFoundError("Bulletin not found");
  }

  await bulletinsService.recordView(id, currentUser.id);

  return bulletin;
}
