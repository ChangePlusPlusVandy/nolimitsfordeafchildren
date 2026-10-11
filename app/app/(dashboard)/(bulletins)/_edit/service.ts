import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type BulletinEntity, type BulletinInsert, BulletinTable } from "@/_platform/db/schema";
import { BadRequestError } from "@/_shared/server/errors";

import type { UpdateBulletinInput } from "../_domain/types";

export async function updateBulletin(
  id: string,
  data: UpdateBulletinInput,
): Promise<BulletinEntity | null> {
  const existing = await db.select().from(BulletinTable).where(eq(BulletinTable.id, id)).limit(1);

  if (existing.length === 0) {
    return null;
  }

  const resolvedRoleTarget = data.role_target ?? existing[0]!.role_target;
  if (data.requires_initials && resolvedRoleTarget !== "parent" && resolvedRoleTarget !== "all") {
    throw new BadRequestError("requires_initials can only be enabled for parent-facing bulletins");
  }

  const updateData: Partial<BulletinInsert> = {
    updated_at: new Date(),
  };

  if (data.title !== undefined) {
    updateData.title = data.title;
  }
  if (data.body !== undefined) {
    updateData.body = data.body;
  }
  if (data.scope !== undefined) {
    updateData.scope = data.scope;
  }
  if (data.site_id !== undefined) {
    updateData.site_id =
      data.scope === "site" || existing[0]!.scope === "site" ? data.site_id : null;
  }
  if (data.role_target !== undefined) {
    updateData.role_target = data.role_target;
  }
  if (data.requires_approval !== undefined) {
    updateData.requires_approval = data.requires_approval;
  }
  if (data.requires_initials !== undefined) {
    updateData.requires_initials = data.requires_initials;
  }
  if (data.approval_status !== undefined) {
    updateData.approval_status = data.approval_status;
  }
  if (data.reviewed_by !== undefined) {
    updateData.reviewed_by = data.reviewed_by;
  }
  if (data.reviewed_at !== undefined) {
    updateData.reviewed_at = data.reviewed_at ? new Date(data.reviewed_at) : null;
  }
  if (data.review_notes !== undefined) {
    updateData.review_notes = data.review_notes;
  }
  if (data.publish_at !== undefined) {
    updateData.publish_at = data.publish_at ? new Date(data.publish_at) : null;
  }
  if (data.expire_at !== undefined) {
    updateData.expire_at = data.expire_at ? new Date(data.expire_at) : null;
  }

  const result = await db
    .update(BulletinTable)
    .set(updateData)
    .where(eq(BulletinTable.id, id))
    .returning();

  return result[0] ?? null;
}
