import { db } from "@/_platform/db";
import { type LocationEntity, LocationTable } from "@/_platform/db/schema";

import type { CreateLocationDto } from "../_domain/types";

export async function createLocation(data: CreateLocationDto): Promise<LocationEntity> {
  const results = await db
    .insert(LocationTable)
    .values({ ...data, created_at: new Date(), updated_at: new Date() })
    .returning();

  return results[0]!;
}
