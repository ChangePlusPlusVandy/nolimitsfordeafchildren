"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { documentsService } from "../_domain/server";
import type { ReviewDocumentInput } from "../_domain/types";
import { reviewDocumentSchema } from "./validation";

export async function reviewDocument(id: string, input: Omit<ReviewDocumentInput, "reviewed_by">) {
  const currentUser = await requireRole("administrator");
  const parsed = reviewDocumentSchema.parse(input) as Omit<ReviewDocumentInput, "reviewed_by">;

  const result = await documentsService.reviewDocument(id, {
    ...parsed,
    reviewed_by: currentUser.id,
  });

  if (!result) {
    throw new NotFoundError("Document not found");
  }

  return result;
}
