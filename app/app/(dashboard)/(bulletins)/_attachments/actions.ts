"use server";

import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError, NotFoundError } from "@/_shared/server/errors";

import { bulletinsService } from "../_domain/server";
import type { AddAttachmentInput } from "../_domain/types";
import { addAttachmentSchema, attachmentUploadUrlSchema } from "./validation";

export async function addBulletinAttachment(id: string, input: AddAttachmentInput) {
  await requireRole("administrator");

  if (!input.file_url || !input.file_name) {
    throw new BadRequestError("file_url and file_name are required");
  }

  const parsed = addAttachmentSchema.parse(input) as AddAttachmentInput;

  return await bulletinsService.addAttachment(id, parsed);
}

export async function getBulletinAttachmentUploadUrl(input: {
  file_name: string;
  content_type: string;
}) {
  await requireRole("administrator");

  if (!input.file_name || !input.content_type) {
    throw new BadRequestError("file_name and content_type are required");
  }

  const parsed = attachmentUploadUrlSchema.parse(input);
  return await bulletinsService.getAttachmentUploadUrl(parsed);
}

export async function deleteBulletinAttachment(_id: string, attachmentId: string) {
  await requireRole("administrator");
  const deleted = await bulletinsService.deleteAttachment(attachmentId);
  if (!deleted) {
    throw new NotFoundError("Attachment not found");
  }
  return { success: true, message: "Attachment deleted" };
}
