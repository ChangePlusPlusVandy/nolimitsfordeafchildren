import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { DocumentTable } from "@/_platform/db/schema";
import { deleteFile, extractKeyFromUrl } from "@/_platform/storage/r2";

import type { DocumentWithMetadata } from "../_domain/types";

export async function deleteDocument(
  id: string,
  show: (id: string) => Promise<DocumentWithMetadata | null>,
): Promise<boolean> {
  const document = await show(id);
  if (!document) {
    return false;
  }

  const fileKey = extractKeyFromUrl(document.file_url);
  if (fileKey) {
    try {
      await deleteFile(fileKey);
    } catch (error) {
      console.error("Failed to delete file from S3:", error);
      // Continue with database deletion even if storage deletion fails.
    }
  }

  await db.delete(DocumentTable).where(eq(DocumentTable.id, id));

  return true;
}
