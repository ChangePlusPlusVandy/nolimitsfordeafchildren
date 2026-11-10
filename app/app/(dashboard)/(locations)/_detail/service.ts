import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type LocationEntity, LocationTable } from "@/_platform/db/schema";

export async function getLocation(siteId: string): Promise<LocationEntity | null> {
  const results = await db
    .select()
    .from(LocationTable)
    .where(eq(LocationTable.id, siteId))
    .limit(1);

  return results[0] || null;
}
