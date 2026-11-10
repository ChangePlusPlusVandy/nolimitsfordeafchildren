"use server";

import {
  type ConfirmUploadInput,
  DocumentsService,
  type GetUploadUrlInput,
} from "@/(dashboard)/(documents)/_domain/server";
import { requireRole } from "@/_platform/auth/guard";
import { ForbiddenError } from "@/_shared/server/errors";

import { isParentLinkedToStudent } from "../_access/service";
import { confirmUploadSchema, uploadUrlSchema } from "./validation";

async function assertParentOwnsChild(parentUserId: string, studentId: string): Promise<void> {
  const linked = await isParentLinkedToStudent(parentUserId, studentId);
  if (!linked) {
    throw new ForbiddenError("You can only upload documents for your linked children");
  }
}

/**
 * Validate parent linkage before delegating document uploads.
 */
export async function getChildDocumentUploadUrl(
  studentId: string,
  input: Omit<GetUploadUrlInput, "entity_type" | "entity_id">,
) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);

  const parsed = uploadUrlSchema.parse(input);
  return await new DocumentsService().getUploadUrl({
    entity_type: "student",
    entity_id: studentId,
    ...parsed,
  });
}

/**
 * Validate parent linkage before confirming document uploads.
 */
export async function confirmChildDocumentUpload(
  studentId: string,
  input: Omit<ConfirmUploadInput, "entity_type" | "entity_id" | "uploaded_by">,
) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);

  const parsed = confirmUploadSchema.parse(input);
  return await new DocumentsService().confirmUpload({
    entity_type: "student",
    entity_id: studentId,
    uploaded_by: user.id,
    ...parsed,
  });
}
