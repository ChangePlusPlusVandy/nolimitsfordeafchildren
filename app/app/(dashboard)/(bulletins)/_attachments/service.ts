import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type BulletinAttachmentEntity,
  type BulletinAttachmentInsert,
  BulletinAttachmentTable,
  BulletinTable,
} from "@/_platform/db/schema";
import { getPublicUrl, getUploadUrl } from "@/_platform/storage/r2";
import { NotFoundError } from "@/_shared/server/errors";

import type { AddAttachmentInput, GetBulletinAttachmentUploadUrlInput } from "../_domain/types";

export async function addBulletinAttachment(
  bulletinId: string,
  data: AddAttachmentInput,
): Promise<BulletinAttachmentEntity> {
  const bulletin = await db
    .select()
    .from(BulletinTable)
    .where(eq(BulletinTable.id, bulletinId))
    .limit(1);

  if (bulletin.length === 0) {
    throw new NotFoundError("Bulletin not found");
  }

  const attachment: BulletinAttachmentInsert = {
    bulletin_id: bulletinId,
    file_url: data.file_url,
    file_name: data.file_name,
    file_size: data.file_size ?? null,
    mime_type: data.mime_type ?? null,
    created_at: new Date(),
  };

  const result = await db.insert(BulletinAttachmentTable).values(attachment).returning();

  return result[0]!;
}

export async function getBulletinAttachmentUploadUrl(
  input: GetBulletinAttachmentUploadUrlInput,
): Promise<{ upload_url: string; file_key: string; file_url: string }> {
  const extension = input.file_name.split(".").pop() || "bin";
  const fileKey = `bulletins/attachments/${randomUUID()}.${extension}`;
  const uploadUrl = getUploadUrl(fileKey, input.content_type);
  const fileUrl = getPublicUrl(fileKey);

  return {
    upload_url: uploadUrl,
    file_key: fileKey,
    file_url: fileUrl,
  };
}

export async function deleteBulletinAttachment(attachmentId: string): Promise<boolean> {
  const result = await db
    .delete(BulletinAttachmentTable)
    .where(eq(BulletinAttachmentTable.id, attachmentId))
    .returning();

  return result.length > 0;
}
