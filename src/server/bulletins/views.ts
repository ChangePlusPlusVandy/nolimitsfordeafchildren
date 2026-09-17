import { and, desc, eq } from "drizzle-orm";
import { BulletinViewTable, UserTable } from "@/db/schema";
import { db } from "@/lib/db";
import type { BulletinViewWithUser } from "@/server/bulletins/types";

export async function recordBulletinView(bulletinId: string, userId: string): Promise<void> {
  const existing = await db
    .select()
    .from(BulletinViewTable)
    .where(
      and(eq(BulletinViewTable.bulletin_id, bulletinId), eq(BulletinViewTable.user_id, userId)),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(BulletinViewTable)
      .set({
        last_viewed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(BulletinViewTable.id, existing[0]!.id));
    return;
  }

  await db.insert(BulletinViewTable).values({
    bulletin_id: bulletinId,
    user_id: userId,
    viewed_at: new Date(),
    last_viewed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  });
}

export async function getBulletinViewStats(bulletinId: string): Promise<{
  count: number;
  viewers: BulletinViewWithUser[];
}> {
  const rows = await db
    .select({
      id: BulletinViewTable.id,
      bulletin_id: BulletinViewTable.bulletin_id,
      user_id: BulletinViewTable.user_id,
      viewed_at: BulletinViewTable.viewed_at,
      last_viewed_at: BulletinViewTable.last_viewed_at,
      created_at: BulletinViewTable.created_at,
      updated_at: BulletinViewTable.updated_at,
      user_name: UserTable.name,
      user_email: UserTable.email,
      user_role: UserTable.role,
    })
    .from(BulletinViewTable)
    .innerJoin(UserTable, eq(BulletinViewTable.user_id, UserTable.id))
    .where(eq(BulletinViewTable.bulletin_id, bulletinId))
    .orderBy(desc(BulletinViewTable.last_viewed_at));

  return {
    count: rows.length,
    viewers: rows.map((row) => ({
      id: row.id,
      bulletin_id: row.bulletin_id,
      user_id: row.user_id,
      viewed_at: row.viewed_at,
      last_viewed_at: row.last_viewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        role: row.user_role,
      },
    })),
  };
}
