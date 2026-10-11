"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { assertCanAccessDocumentEntity } from "../_domain/access";
import { documentsService } from "../_domain/server";
import type { EntityType } from "../_domain/types";

export async function getDocument(id: string) {
  const user = await requireRole();
  const result = await documentsService.show(id);
  if (!result) {
    throw new NotFoundError("Document not found");
  }
  await assertCanAccessDocumentEntity(user, result.entity_type as EntityType, result.entity_id);
  return result;
}
