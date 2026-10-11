"use server";

import { requireRole } from "@/_platform/auth/guard";

import { documentsService } from "../_domain/server";
import type { ConfirmUploadInput, GetUploadUrlInput } from "../_domain/types";
import { confirmUploadSchema, uploadUrlSchema } from "./validation";

export async function getDocumentUploadUrl(input: GetUploadUrlInput) {
  await requireRole();
  const parsed = uploadUrlSchema.parse(input) as GetUploadUrlInput;
  return await documentsService.getUploadUrl(parsed);
}

export async function confirmDocumentUpload(input: Omit<ConfirmUploadInput, "uploaded_by">) {
  const currentUser = await requireRole();
  const parsed = confirmUploadSchema.parse(input) as Omit<ConfirmUploadInput, "uploaded_by">;

  const document = await documentsService.confirmUpload({
    ...parsed,
    uploaded_by: currentUser.id,
  });
  return document;
}
