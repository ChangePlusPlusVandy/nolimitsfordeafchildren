"use server";

import { z } from "zod";
import {
  type ConfirmUploadInput,
  type DocumentReviewStatus,
  DocumentsService,
  type DocumentType,
  type EntityType,
  type GetUploadUrlInput,
  type ReviewDocumentInput,
} from "@/server/documents/service";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";

const entityTypeSchema = z.enum(["student", "teacher"]);
const documentTypeSchema = z.enum([
  "audiogram",
  "iep",
  "cv",
  "annual_test_result",
  "pre_report",
  "graduation_speech",
  "other",
]);

const uploadUrlSchema = z
  .object({
    entity_type: entityTypeSchema,
    entity_id: z.string().min(1),
    document_type: documentTypeSchema,
    file_name: z.string().min(1).max(255),
    content_type: z.string().min(1).max(200),
  })
  .passthrough();

const reviewDocumentSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    review_notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();

/**
 * POST /v1/documents/upload-url — get the authenticated upload target for a
 * new document (any authenticated user). The upload URL is
 * /api/files/upload?key=...&purpose=documents (R2 has no S3 presigning).
 */
export async function getDocumentUploadUrl(input: GetUploadUrlInput) {
  await requireRole();
  const parsed = uploadUrlSchema.parse(input) as GetUploadUrlInput;
  return await new DocumentsService().getUploadUrl(parsed);
}

/**
 * POST /v1/documents — confirm an upload and create the document record.
 */
export async function confirmDocumentUpload(input: Omit<ConfirmUploadInput, "uploaded_by">) {
  const currentUser = await requireRole();
  const parsed = uploadUrlSchema
    .omit({ content_type: true })
    .merge(
      z.object({
        file_url: z.string().min(1).max(500),
        file_size: z.number().int().nonnegative().optional(),
        mime_type: z.string().max(200).optional(),
        document_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .optional(),
        session_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .optional(),
        session_type: z.string().max(100).nullable().optional(),
      }),
    )
    .passthrough()
    .parse(input) as Omit<ConfirmUploadInput, "uploaded_by">;

  const document = await new DocumentsService().confirmUpload({
    ...parsed,
    uploaded_by: currentUser.id,
  });
  return document;
}

/**
 * DELETE /v1/documents/:id — delete a document (admin only).
 */
export async function deleteDocument(id: string) {
  await requireRole("administrator");
  const deleted = await new DocumentsService().delete(id);
  if (!deleted) {
    throw new NotFoundError("Document not found");
  }
  return { success: true };
}

/**
 * PATCH /v1/documents/:id/review — approve/reject (admin only).
 */
export async function reviewDocument(id: string, input: Omit<ReviewDocumentInput, "reviewed_by">) {
  const currentUser = await requireRole("administrator");
  const parsed = reviewDocumentSchema.parse(input) as Omit<ReviewDocumentInput, "reviewed_by">;

  let result: Awaited<ReturnType<DocumentsService["reviewDocument"]>>;
  try {
    result = await new DocumentsService().reviewDocument(id, {
      ...parsed,
      reviewed_by: currentUser.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }

  if (!result) {
    throw new NotFoundError("Document not found");
  }

  return result;
}

export type { DocumentReviewStatus, DocumentType, EntityType };
