import { desc, eq } from "drizzle-orm";
import {
  type BulletinAcknowledgementEntity,
  type BulletinAcknowledgementInsert,
  BulletinAcknowledgementTable,
  BulletinTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import type {
  AcknowledgeBulletinInput,
  BulletinAcknowledgementWithUser,
} from "@/server/bulletins/types";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";

export async function getBulletinAcknowledgementStats(bulletinId: string): Promise<{
  count: number;
  acknowledgements: BulletinAcknowledgementWithUser[];
}> {
  const rows = await db
    .select({
      id: BulletinAcknowledgementTable.id,
      bulletin_id: BulletinAcknowledgementTable.bulletin_id,
      user_id: BulletinAcknowledgementTable.user_id,
      initials: BulletinAcknowledgementTable.initials,
      acknowledged_at: BulletinAcknowledgementTable.acknowledged_at,
      created_at: BulletinAcknowledgementTable.created_at,
      updated_at: BulletinAcknowledgementTable.updated_at,
      user_name: UserTable.name,
      user_email: UserTable.email,
      user_role: UserTable.role,
    })
    .from(BulletinAcknowledgementTable)
    .innerJoin(UserTable, eq(BulletinAcknowledgementTable.user_id, UserTable.id))
    .where(eq(BulletinAcknowledgementTable.bulletin_id, bulletinId))
    .orderBy(desc(BulletinAcknowledgementTable.acknowledged_at));

  return {
    count: rows.length,
    acknowledgements: rows.map((row) => ({
      id: row.id,
      bulletin_id: row.bulletin_id,
      user_id: row.user_id,
      initials: row.initials,
      acknowledged_at: row.acknowledged_at,
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

export async function acknowledgeBulletin(
  bulletinId: string,
  userId: string,
  input: AcknowledgeBulletinInput,
): Promise<BulletinAcknowledgementEntity> {
  const initials = input.initials.trim().toUpperCase();
  if (!initials) {
    throw new BadRequestError("Initials are required");
  }
  if (initials.length > 8) {
    throw new BadRequestError("Initials must be 8 characters or fewer");
  }

  const bulletin = await db
    .select({ id: BulletinTable.id, requires_initials: BulletinTable.requires_initials })
    .from(BulletinTable)
    .where(eq(BulletinTable.id, bulletinId))
    .limit(1);

  if (bulletin.length === 0) {
    throw new NotFoundError("Bulletin not found");
  }

  if (!bulletin[0]!.requires_initials) {
    throw new BadRequestError("This bulletin does not require initials acknowledgement");
  }

  const now = new Date();
  const payload: BulletinAcknowledgementInsert = {
    bulletin_id: bulletinId,
    user_id: userId,
    initials,
    acknowledged_at: now,
    created_at: now,
    updated_at: now,
  };

  const result = await db
    .insert(BulletinAcknowledgementTable)
    .values(payload)
    .onConflictDoUpdate({
      target: [BulletinAcknowledgementTable.bulletin_id, BulletinAcknowledgementTable.user_id],
      set: {
        initials,
        acknowledged_at: now,
        updated_at: now,
      },
    })
    .returning();

  return result[0]!;
}
