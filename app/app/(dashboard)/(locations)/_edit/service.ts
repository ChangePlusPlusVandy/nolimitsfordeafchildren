import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type LocationEntity, LocationTable } from "@/_platform/db/schema";

import type { UpdateLocationDto } from "../_domain/types";

export async function updateLocation(
  siteId: string,
  data: UpdateLocationDto,
): Promise<LocationEntity | null> {
  const results = await db
    .update(LocationTable)
    .set({ ...data, updated_at: new Date() })
    .where(eq(LocationTable.id, siteId))
    .returning();

  return results[0] || null;
}
