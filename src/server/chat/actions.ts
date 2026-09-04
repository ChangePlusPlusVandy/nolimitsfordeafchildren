"use server";

import { z } from "zod";
import { type ChatChannel, ChatService } from "@/server/chat/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError, NotFoundError } from "@/server/shared/errors";

const channelSchema = z.enum(["community", "teacher"]);

const createMessageSchema = z
  .object({
    channel: channelSchema,
    message: z.string().min(1).max(2000),
    is_announcement: z.boolean().optional(),
  })
  .passthrough();

const announcementSchema = z
  .object({
    is_announcement: z.boolean(),
  })
  .passthrough();

/**
 * POST /v1/chat/messages — create a chat message (administrator | teacher).
 */
export async function createChatMessage(input: {
  channel: ChatChannel;
  message: string;
  is_announcement?: boolean;
}) {
  const currentUser = await requireRole("administrator", "teacher");

  if (!input.channel || !input.message) {
    throw new HttpError(400, "BAD_REQUEST", "channel and message are required");
  }

  const parsed = createMessageSchema.parse(input);

  try {
    return await new ChatService().createMessage({
      channel: parsed.channel,
      message: parsed.message,
      is_announcement: parsed.is_announcement,
      created_by: currentUser.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("cannot be empty")) {
      throw new HttpError(422, "UNPROCESSABLE_ENTITY", error.message);
    }
    throw error;
  }
}

/**
 * PATCH /v1/chat/messages/:id/announcement — administrator | teacher
 * (teachers may only toggle their own messages).
 */
export async function updateChatMessageAnnouncement(
  id: string,
  input: { is_announcement: boolean },
) {
  const currentUser = await requireRole("administrator", "teacher");
  const parsed = announcementSchema.parse(input);

  try {
    const updated = await new ChatService().updateAnnouncement(
      id,
      currentUser.id,
      Boolean(parsed.is_announcement),
      currentUser.role === "administrator",
    );

    if (!updated) {
      throw new NotFoundError("Message not found");
    }

    return updated;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Only the message author")) {
      throw new HttpError(403, "FORBIDDEN", error.message);
    }
    throw error;
  }
}

/**
 * DELETE /v1/chat/messages/:id — administrator only (soft delete).
 */
export async function deleteChatMessage(id: string) {
  const currentUser = await requireRole("administrator");
  const deleted = await new ChatService().deleteMessage(id, currentUser.id);
  if (!deleted) {
    throw new NotFoundError("Message not found");
  }
  return { ok: true };
}

/**
 * Client-facing alias (src/client/chat.ts imports this name).
 */
export async function updateChatAnnouncement(id: string, input: { is_announcement: boolean }) {
  return await updateChatMessageAnnouncement(id, input);
}
