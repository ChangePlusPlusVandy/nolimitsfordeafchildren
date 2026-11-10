"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { deletePhoto as deleteRecord } from "./service";

export async function deletePhoto(id: string) {
  await requireRole("administrator");
  const deleted = await deleteRecord(id);
  if (!deleted) {
    throw new NotFoundError("Photo not found");
  }
  return { ok: true };
}
