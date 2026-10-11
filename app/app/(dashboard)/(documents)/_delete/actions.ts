"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { documentsService } from "../_domain/server";

export async function deleteDocument(id: string) {
  await requireRole("administrator");
  const deleted = await documentsService.delete(id);
  if (!deleted) {
    throw new NotFoundError("Document not found");
  }
  return { success: true };
}
