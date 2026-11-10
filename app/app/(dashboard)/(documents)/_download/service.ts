import { inArray } from "drizzle-orm";

import { db } from "@/_platform/db";
import { DocumentTable, type UserEntity } from "@/_platform/db/schema";
import { extractKeyFromUrl, getFileUrlAliases, getPublicUrl } from "@/_platform/storage/r2";
import { ForbiddenError } from "@/_shared/server/errors";

import type { DocumentWithMetadata } from "../_domain/types";

/**
 * File-route counterpart of the parent "approved only" list rule. The caller has
 * already checked the student/teacher link from the key; this only adds the
 * review-status rule. Upload confirmation creates the row before the parent
 * needs to download, so an unmatched file is not evidence of ownership.
 */
export async function assertCanViewDocumentFile(
  fileUrl: string,
  user: Pick<UserEntity, "role">,
): Promise<void> {
  if (user.role !== "parent") {
    return;
  }

  const [document] = await db
    .select({ review_status: DocumentTable.review_status })
    .from(DocumentTable)
    .where(inArray(DocumentTable.file_url, getFileUrlAliases(fileUrl)))
    .limit(1);

  if (!document || document.review_status !== "approved") {
    throw new ForbiddenError("You cannot access this document");
  }
}

export async function getDownloadUrl(
  id: string,
  show: (id: string) => Promise<DocumentWithMetadata | null>,
): Promise<{ download_url: string } | null> {
  const document = await show(id);
  if (!document) {
    return null;
  }

  const fileKey = extractKeyFromUrl(document.file_url);
  if (!fileKey) {
    // Preserve external URLs; R2 downloads use the authenticated file route.
    return { download_url: document.file_url };
  }

  return { download_url: getPublicUrl(fileKey) };
}
