"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { bulletinsService } from "../_domain/server";

export async function deleteBulletin(id: string) {
  await requireRole("administrator");
  const deleted = await bulletinsService.delete(id);
  if (!deleted) {
    throw new NotFoundError("Bulletin not found");
  }
  return { success: true, message: "Bulletin deleted" };
}
