"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { bulletinsService } from "../_domain/server";

export async function getBulletinAcknowledgements(id: string) {
  await requireRole("administrator");
  const bulletin = await bulletinsService.show(id);
  if (!bulletin) {
    throw new NotFoundError("Bulletin not found");
  }

  return await bulletinsService.getAcknowledgementStats(id);
}

export async function getBulletinAcknowledgementStats(id: string) {
  return await getBulletinAcknowledgements(id);
}
