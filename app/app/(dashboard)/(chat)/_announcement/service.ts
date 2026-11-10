import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type ChatMessageEntity, ChatMessageTable } from "@/_platform/db/schema";
import { ForbiddenError } from "@/_shared/server/errors";

export async function updateAnnouncement(
  messageId: string,
  actorUserId: string,
  isAnnouncement: boolean,
  isAdmin: boolean,
): Promise<ChatMessageEntity | null> {
  const existing = await db
    .select({ id: ChatMessageTable.id, created_by: ChatMessageTable.created_by })
    .from(ChatMessageTable)
    .where(and(eq(ChatMessageTable.id, messageId), isNull(ChatMessageTable.deleted_at)))
    .limit(1);

  if (!existing[0]) {
    return null;
  }

  if (!isAdmin && existing[0].created_by !== actorUserId) {
    throw new ForbiddenError("Only the message author or an admin can update announcement status");
  }

  const result = await db
    .update(ChatMessageTable)
    .set({
      is_announcement: isAnnouncement,
      updated_at: new Date(),
    })
    .where(eq(ChatMessageTable.id, messageId))
    .returning();

  return result[0] ?? null;
}
