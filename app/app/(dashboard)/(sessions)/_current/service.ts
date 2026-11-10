import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type SessionEntity, SessionTable } from "@/_platform/db/schema";
import { todayStr } from "@/_shared/server/dates";

export async function getCurrentSession(): Promise<SessionEntity | null> {
  const today = todayStr();

  const rows = await db
    .select()
    .from(SessionTable)
    .where(
      and(
        eq(SessionTable.is_archived, false),
        eq(SessionTable.is_active, true),
        lte(SessionTable.start_date, today),
        gte(SessionTable.end_date, today),
      ),
    )
    .orderBy(sql`abs(unixepoch(${SessionTable.start_date}) - unixepoch())`)
    .limit(1);

  return rows[0] ?? null;
}
