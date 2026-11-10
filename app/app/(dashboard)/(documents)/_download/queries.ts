"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { assertCanAccessDocumentEntity, assertReviewStatusVisible } from "../_domain/access";
import { documentsService } from "../_domain/server";
import type { EntityType } from "../_domain/types";

export async function getDocumentDownload(id: string) {
  const user = await requireRole();
  const doc = await documentsService.show(id);
  if (!doc) {
    throw new NotFoundError("Document not found");
  }
  await assertCanAccessDocumentEntity(user, doc.entity_type as EntityType, doc.entity_id);
  assertReviewStatusVisible(user, doc);
  const result = await documentsService.getDownloadUrl(id);
  if (!result) {
    throw new NotFoundError("Document not found");
  }
  return result;
}

export async function getDocumentDownloadUrl(id: string) {
  return await getDocumentDownload(id);
}
