"use server";
import { type ChatChannel, ChatService } from "@/server/chat/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError } from "@/server/shared/errors";

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

  return await new ChatService().listMessages({ channel, page: query.page, limit: query.limit });
}
