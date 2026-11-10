import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type ChatMessageEntity, ChatMessageTable, UserTable } from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type { ChatChannel } from "../_domain/types";

export async function listMessages(input: {
  channel: ChatChannel;
  page?: number;
  limit?: number;
}): Promise<
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
