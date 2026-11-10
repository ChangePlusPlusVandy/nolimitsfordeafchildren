"use server";

import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError } from "@/_shared/server/errors";

import { chatService } from "../_domain/server";
import type { ChatChannel } from "../_domain/types";
import { createMessageSchema } from "./validation";

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
