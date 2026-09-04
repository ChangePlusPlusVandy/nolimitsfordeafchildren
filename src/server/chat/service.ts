import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ChatMessageTable, UserTable, type ChatMessageEntity } from "@/db/schema";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";

export type ChatChannel = "community" | "teacher";

export interface CreateChatMessageInput {
  channel: ChatChannel;
  message: string;
  is_announcement?: boolean;
  created_by: string;
}

export class ChatService {
  async listMessages(input: { channel: ChatChannel; page?: number; limit?: number }): Promise<
    PaginatedResponse<
      ChatMessageEntity & {
        created_by_user: {
          id: string;
          name: string;
          role: "administrator" | "teacher" | "parent" | "unassigned";
        };
      }
    >
  > {
    const { page, limit, offset } = getPagination(input, 50, 200);
    const whereClause = and(
      eq(ChatMessageTable.channel, input.channel),
      isNull(ChatMessageTable.deleted_at),
    );

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ChatMessageTable)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    const rows = await db
      .select({
        id: ChatMessageTable.id,
        channel: ChatMessageTable.channel,
        message: ChatMessageTable.message,
        is_announcement: ChatMessageTable.is_announcement,
        created_by: ChatMessageTable.created_by,
        deleted_at: ChatMessageTable.deleted_at,
        deleted_by: ChatMessageTable.deleted_by,
        created_at: ChatMessageTable.created_at,
        updated_at: ChatMessageTable.updated_at,
        created_by_user_id: UserTable.id,
        created_by_user_name: UserTable.name,
        created_by_user_role: UserTable.role,
      })
      .from(ChatMessageTable)
      .innerJoin(UserTable, eq(ChatMessageTable.created_by, UserTable.id))
      .where(whereClause)
      .orderBy(desc(ChatMessageTable.is_announcement), desc(ChatMessageTable.created_at))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      message: row.message,
      is_announcement: row.is_announcement,
      created_by: row.created_by,
      deleted_at: row.deleted_at,
      deleted_by: row.deleted_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by_user: {
        id: row.created_by_user_id,
        name: row.created_by_user_name,
        role: row.created_by_user_role,
      },
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  async createMessage(input: CreateChatMessageInput): Promise<ChatMessageEntity> {
    const trimmed = input.message.trim();
    if (!trimmed) {
      throw new Error("Message cannot be empty");
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

  async updateAnnouncement(
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
      throw new Error("Only the message author or an admin can update announcement status");
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

  async deleteMessage(messageId: string, actorUserId: string): Promise<boolean> {
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
}
