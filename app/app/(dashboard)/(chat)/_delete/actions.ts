"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { chatService } from "../_domain/server";

export async function deleteChatMessage(id: string) {
  const currentUser = await requireRole("administrator");
  const deleted = await chatService.deleteMessage(id, currentUser.id);
  if (!deleted) {
    throw new NotFoundError("Message not found");
  }
  return { ok: true };
}
