import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ChatMessageTable } from "@/_platform/db/schema";

export async function deleteMessage(messageId: string, actorUserId: string): Promise<boolean> {
  const result = await db
    .update(ChatMessageTable)
    .set({
      deleted_at: new Date(),
      deleted_by: actorUserId,
      updated_at: new Date(),
    })
    .where(and(eq(ChatMessageTable.id, messageId), isNull(ChatMessageTable.deleted_at)))
    .returning({ id: ChatMessageTable.id });

  return result.length > 0;
}
