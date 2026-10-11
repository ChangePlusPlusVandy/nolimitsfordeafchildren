"use server";
import { requireRole } from "@/_platform/auth/guard";
import { HttpError } from "@/_shared/server/errors";

import { chatService } from "../_domain/server";
import type { ChatChannel } from "../_domain/types";

/**
 * GET /v1/chat/messages — administrator | teacher.
 */
export async function listChatMessages(
  query: { channel?: ChatChannel; page?: number; limit?: number } = {},
) {
  await requireRole("administrator", "teacher");

  const channel = query.channel ?? "community";
  if (channel !== "community" && channel !== "teacher") {
    throw new HttpError(400, "BAD_REQUEST", "Invalid channel");
  }

  return await chatService.listMessages({ channel, page: query.page, limit: query.limit });
}
