"use server";

import { z } from "zod";

import { type ChatChannel, chatService } from "@/server/chat/service";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";

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

export async function createChatMessage(input: {
  channel: ChatChannel;
  message: string;
  is_announcement?: boolean;
}) {
  const currentUser = await requireRole("administrator", "teacher");

  if (!input.channel || !input.message) {
    throw new BadRequestError("channel and message are required");
  }

  const parsed = createMessageSchema.parse(input);

  return await chatService.createMessage({
    channel: parsed.channel,
    message: parsed.message,
    is_announcement: parsed.is_announcement,
    created_by: currentUser.id,
  });
}

export async function updateChatMessageAnnouncement(
  id: string,
  input: { is_announcement: boolean },
) {
  const currentUser = await requireRole("administrator", "teacher");
  const parsed = announcementSchema.parse(input);

  const updated = await chatService.updateAnnouncement(
    id,
    currentUser.id,
    Boolean(parsed.is_announcement),
    currentUser.role === "administrator",
  );

  if (!updated) {
    throw new NotFoundError("Message not found");
  }

  return updated;
}

export async function deleteChatMessage(id: string) {
  const currentUser = await requireRole("administrator");
  const deleted = await chatService.deleteMessage(id, currentUser.id);
  if (!deleted) {
    throw new NotFoundError("Message not found");
  }
  return { ok: true };
}

export async function updateChatAnnouncement(id: string, input: { is_announcement: boolean }) {
  return await updateChatMessageAnnouncement(id, input);
}
