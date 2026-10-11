"use server";
import { requireRole } from "@/_platform/auth/guard";

import type { ListPhotosQuery } from "../_domain/types";
import { listPhotos as listRecords } from "./service";

/**
 * GET /v1/photos — list photos (administrator | teacher | parent; parents
 * scoped to their children's locations by the service).
 */
export async function listPhotos(query: ListPhotosQuery = {}) {
  const currentUser = await requireRole("administrator", "teacher", "parent");
  return await listRecords(query, currentUser);
}
