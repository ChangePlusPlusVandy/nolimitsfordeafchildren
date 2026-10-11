import { db } from "@/_platform/db";
import { type ChatMessageEntity, ChatMessageTable } from "@/_platform/db/schema";
import { BadRequestError } from "@/_shared/server/errors";

import type { CreateChatMessageInput } from "../_domain/types";

export async function createMessage(input: CreateChatMessageInput): Promise<ChatMessageEntity> {
  const trimmed = input.message.trim();
  if (!trimmed) {
    throw new BadRequestError("Message cannot be empty");
  }

  const result = await db
    .insert(ChatMessageTable)
    .values({
      channel: input.channel,
      message: trimmed,
      is_announcement: input.is_announcement ?? false,
      created_by: input.created_by,
    })
    .returning();

  return result[0]!;
}
