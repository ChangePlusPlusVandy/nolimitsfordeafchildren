"use server";

import { z } from "zod";
import {
  type CreatePhotoInput,
  type GetPhotoUploadUrlInput,
  PhotosService,
} from "@/server/photos/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError, NotFoundError } from "@/server/shared/errors";

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

/** Map domain-error message patterns to HTTP statuses (as the controller did). */
function mapPhotoError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes("not found")) throw new HttpError(404, "NOT_FOUND", error.message);
    if (error.message.includes("not assigned"))
      throw new HttpError(403, "FORBIDDEN", error.message);
    if (error.message.includes("Student is not assigned"))
      throw new HttpError(422, "UNPROCESSABLE_ENTITY", error.message);
  }
  throw error;
}

/**
 * POST /v1/photos/upload-url — upload target for a photo
 * (administrator | teacher).
 */
export async function getPhotoUploadUrl(input: GetPhotoUploadUrlInput) {
  const currentUser = await requireRole("administrator", "teacher");

  if (!input.location_id || !input.session_date || !input.file_name || !input.content_type) {
    throw new HttpError(
      400,
      "BAD_REQUEST",
      "location_id, session_date, file_name, and content_type are required",
    );
  }

  const parsed = getUploadUrlSchema.parse(input) as GetPhotoUploadUrlInput;

  try {
    return await new PhotosService().getUploadUrl(parsed, currentUser);
  } catch (error) {
    mapPhotoError(error);
  }
}

/**
 * POST /v1/photos — create a photo record (administrator | teacher).
 */
export async function createPhoto(input: CreatePhotoInput) {
  const currentUser = await requireRole("administrator", "teacher");

  if (!input.location_id || !input.session_date || !input.file_url || !input.file_name) {
    throw new HttpError(
      400,
      "BAD_REQUEST",
      "location_id, session_date, file_url, and file_name are required",
    );
  }

  const parsed = createPhotoSchema.parse(input) as CreatePhotoInput;

  try {
    return await new PhotosService().createPhoto(parsed, currentUser);
  } catch (error) {
    mapPhotoError(error);
  }
}

/**
 * DELETE /v1/photos/:id — delete a photo (admin only).
 */
export async function deletePhoto(id: string) {
  await requireRole("administrator");
  const deleted = await new PhotosService().deletePhoto(id);
  if (!deleted) {
    throw new NotFoundError("Photo not found");
  }
  return { ok: true };
}
