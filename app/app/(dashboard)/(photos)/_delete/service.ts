import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { PhotoTable } from "@/_platform/db/schema";
import { deleteFile, extractKeyFromUrl } from "@/_platform/storage/r2";

export async function deletePhoto(photoId: string): Promise<boolean> {
  const photo = await db.select().from(PhotoTable).where(eq(PhotoTable.id, photoId)).limit(1);
  if (!photo[0]) {
    return false;
  }

  const fileKey = extractKeyFromUrl(photo[0].file_url);
  if (fileKey) {
    await deleteFile(fileKey);
  }

  await db.delete(PhotoTable).where(eq(PhotoTable.id, photoId));
  return true;
}
