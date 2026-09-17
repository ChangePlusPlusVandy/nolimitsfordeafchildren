"use server";

import { z } from "zod";
import {
  type CreatePhotoInput,
  type GetPhotoUploadUrlInput,
  photosService,
} from "@/server/photos/service";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";

const getUploadUrlSchema = z
  .object({
    location_id: z.string().min(1),
    student_id: z.string().optional(),
    session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    file_name: z.string().min(1).max(255),
    content_type: z.string().min(1).max(200),
  })
  .passthrough();

const createPhotoSchema = z
  .object({
    location_id: z.string().min(1),
    student_id: z.string().optional(),
    session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    file_url: z.string().min(1).max(500),
    file_name: z.string().min(1).max(255),
    file_size: z.number().int().nonnegative().optional(),
    mime_type: z.string().max(200).optional(),
    caption: z.string().max(1000).nullable().optional(),
  })
  .passthrough();

export async function getPhotoUploadUrl(input: GetPhotoUploadUrlInput) {
  const currentUser = await requireRole("administrator", "teacher");

  if (!input.location_id || !input.session_date || !input.file_name || !input.content_type) {
    throw new BadRequestError(
      "location_id, session_date, file_name, and content_type are required",
    );
  }

  const parsed = getUploadUrlSchema.parse(input) as GetPhotoUploadUrlInput;

  return await photosService.getUploadUrl(parsed, currentUser);
}

export async function createPhoto(input: CreatePhotoInput) {
  const currentUser = await requireRole("administrator", "teacher");

  if (!input.location_id || !input.session_date || !input.file_url || !input.file_name) {
    throw new BadRequestError("location_id, session_date, file_url, and file_name are required");
  }

  const parsed = createPhotoSchema.parse(input) as CreatePhotoInput;

  return await photosService.createPhoto(parsed, currentUser);
}

export async function deletePhoto(id: string) {
  await requireRole("administrator");
  const deleted = await photosService.deletePhoto(id);
  if (!deleted) {
    throw new NotFoundError("Photo not found");
  }
  return { ok: true };
}
