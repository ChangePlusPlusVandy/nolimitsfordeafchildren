"use server";

import { z } from "zod";

import {
  type ConfirmUploadInput,
  DocumentsService,
  type GetUploadUrlInput,
} from "@/server/documents/service";
import { ParentsService } from "@/server/parents/service";
import { requireRole } from "@/server/shared/auth-guard";
import { ForbiddenError } from "@/server/shared/errors";

const documentTypeSchema = z.enum([
  "audiogram",
  "iep",
  "cv",
  "annual_test_result",
  "pre_report",
  "graduation_speech",
  "other",
]);

const uploadUrlSchema = z.object({
  document_type: documentTypeSchema,
  file_name: z.string().min(1).max(255),
  content_type: z.string().min(1).max(200),
});

const confirmUploadSchema = uploadUrlSchema.omit({ content_type: true }).merge(
  z.object({
    file_url: z.string().min(1).max(500),
    file_name: z.string().min(1).max(255),
    file_size: z.number().int().nonnegative(),
    mime_type: z.string().max(200),
    document_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    session_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    session_type: z.string().max(100).optional(),
  }),
);

async function assertParentOwnsChild(parentUserId: string, studentId: string): Promise<void> {
  const linked = await new ParentsService().isParentLinkedToStudent(parentUserId, studentId);
  if (!linked) {
    throw new ForbiddenError("You can only upload documents for your linked children");
  }
}

/**
 * Parent-scoped upload URL — validates parent_student_link before delegating
 * to the documents service.
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
 * Parent-scoped upload confirm — validates parent_student_link before creating
 * the document record.
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
