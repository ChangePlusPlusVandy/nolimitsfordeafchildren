import { db } from "@/_platform/db";
import { LocationTable } from "@/_platform/db/schema";

import type { LocationMapPin } from "../_domain/types";

export async function mapSummary(): Promise<LocationMapPin[]> {
  const results = await db
    .select({
      id: LocationTable.id,
      name: LocationTable.name,
      latitude: LocationTable.latitude,
      longitude: LocationTable.longitude,
      type: LocationTable.type,
      is_active: LocationTable.is_active,
    })
    .from(LocationTable)
    .orderBy(LocationTable.name);

  // Preserve the map contract's string coordinates from the numeric driver.
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude?.toString() ?? null,
    longitude: r.longitude?.toString() ?? null,
    type: r.type,
    is_active: r.is_active,
  }));
}
