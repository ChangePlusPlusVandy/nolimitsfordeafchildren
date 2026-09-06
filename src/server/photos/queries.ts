"use server";
import { type ListPhotosQuery, PhotosService } from "@/server/photos/service";
import { requireRole } from "@/server/shared/auth-guard";

/**
 * GET /v1/photos — list photos (administrator | teacher | parent; parents
 * scoped to their children's locations by the service).
 */
export async function listPhotos(query: ListPhotosQuery = {}) {
  const currentUser = await requireRole("administrator", "teacher", "parent");
  return await new PhotosService().listPhotos(query, currentUser);
}
