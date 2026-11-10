import { randomUUID } from "node:crypto";

import { db } from "@/_platform/db";
import {
  type PhotoEntity,
  type PhotoInsert,
  PhotoTable,
  type UserEntity,
} from "@/_platform/db/schema";
import { getPublicUrl, getUploadUrl } from "@/_platform/storage/r2";

import { photoAccess } from "../_access/service";
import type { CreatePhotoInput, GetPhotoUploadUrlInput } from "../_domain/types";

export async function getPhotoUploadUrl(input: GetPhotoUploadUrlInput, currentUser: UserEntity) {
  await photoAccess.assertCanUpload(input, currentUser);

  const extension = input.file_name.split(".").pop() || "jpg";
  const fileKey = `photos/location/${input.location_id}/${input.session_date}/${randomUUID()}.${extension}`;
  const uploadUrl = getUploadUrl(fileKey, input.content_type);

  return {
    upload_url: uploadUrl,
    file_key: fileKey,
    file_url: getPublicUrl(fileKey),
  };
}

export async function createPhoto(
  input: CreatePhotoInput,
  currentUser: UserEntity,
): Promise<PhotoEntity> {
  await photoAccess.assertCanUpload(input, currentUser);

  const payload: PhotoInsert = {
    location_id: input.location_id,
    student_id: input.student_id || null,
    session_date: input.session_date,
    caption: input.caption || null,
    file_url: input.file_url,
    file_name: input.file_name,
    file_size: input.file_size || null,
    mime_type: input.mime_type || null,
    uploaded_by: currentUser.id,
  };

  const result = await db.insert(PhotoTable).values(payload).returning();
  return result[0]!;
}
