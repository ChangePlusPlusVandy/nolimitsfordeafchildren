import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { BulletinAttachmentTable, BulletinTable } from "@/_platform/db/schema";

export async function deleteBulletin(id: string): Promise<boolean> {
  await db.delete(BulletinAttachmentTable).where(eq(BulletinAttachmentTable.bulletin_id, id));

  const result = await db.delete(BulletinTable).where(eq(BulletinTable.id, id)).returning();

  return result.length > 0;
}
