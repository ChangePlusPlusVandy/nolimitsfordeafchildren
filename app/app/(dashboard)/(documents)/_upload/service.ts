import { randomUUID } from "node:crypto";

import { db } from "@/_platform/db";
import { type DocumentEntity, type DocumentInsert, DocumentTable } from "@/_platform/db/schema";
import { getPublicUrl, getUploadUrl as getStorageUploadUrl } from "@/_platform/storage/r2";
import { addMonthsStr } from "@/_shared/server/dates";

import type { ConfirmUploadInput, GetUploadUrlInput } from "../_domain/types";
import type { validateEntity as validateDocumentEntity } from "./entity";

export async function getUploadUrl(
  input: GetUploadUrlInput,
  validateEntity: typeof validateDocumentEntity,
): Promise<{ upload_url: string; file_key: string; file_url: string }> {
  await validateEntity(input.entity_type, input.entity_id);

  const fileExtension = input.file_name.split(".").pop() || "";
  const uniqueId = randomUUID();
  const fileKey = `documents/${input.entity_type}/${input.entity_id}/${input.document_type}/${uniqueId}.${fileExtension}`;

  // R2 uploads and downloads use the authenticated file routes.
  const uploadUrl = getStorageUploadUrl(fileKey, input.content_type);
  const fileUrl = getPublicUrl(fileKey);

  return {
    upload_url: uploadUrl,
    file_key: fileKey,
    file_url: fileUrl,
  };
}

export async function confirmUpload(
  input: ConfirmUploadInput,
  validateEntity: typeof validateDocumentEntity,
): Promise<DocumentEntity> {
  await validateEntity(input.entity_type, input.entity_id);

  // Audiograms are due six months after the test date.
  let nextDueDate: string | null = null;
  if (input.document_type === "audiogram" && input.document_date) {
    nextDueDate = addMonthsStr(input.document_date, 6);
  }

  const newDocument: DocumentInsert = {
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    document_type: input.document_type,
    file_url: input.file_url,
    file_name: input.file_name,
    file_size: input.file_size || null,
    mime_type: input.mime_type || null,
    document_date: input.document_date || null,
    next_due_date: nextDueDate,
    review_status:
      input.document_type === "pre_report" || input.document_type === "graduation_speech"
        ? "pending"
        : "approved",
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    session_date: input.session_date || null,
    session_type: input.session_type || null,
    uploaded_by: input.uploaded_by,
  };

  const result = await db.insert(DocumentTable).values(newDocument).returning();

  return result[0]!;
}
