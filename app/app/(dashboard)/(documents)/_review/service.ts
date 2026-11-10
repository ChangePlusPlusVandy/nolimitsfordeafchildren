import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type DocumentEntity, DocumentTable } from "@/_platform/db/schema";
import { ConflictError } from "@/_shared/server/errors";

import type { ReviewDocumentInput } from "../_domain/types";

export async function reviewDocument(
  id: string,
  input: ReviewDocumentInput,
): Promise<DocumentEntity | null> {
  const existing = await db.select().from(DocumentTable).where(eq(DocumentTable.id, id)).limit(1);
  if (existing.length === 0) {
    return null;
  }

  const current = existing[0]!;
  if (current.review_status !== "pending") {
    throw new ConflictError("Document has already been reviewed");
  }

  const result = await db
    .update(DocumentTable)
    .set({
      review_status: input.status,
      reviewed_by: input.reviewed_by,
      reviewed_at: new Date(),
      review_notes: input.review_notes || null,
      updated_at: new Date(),
    })
    .where(eq(DocumentTable.id, id))
    .returning();

  return result[0] ?? null;
}
