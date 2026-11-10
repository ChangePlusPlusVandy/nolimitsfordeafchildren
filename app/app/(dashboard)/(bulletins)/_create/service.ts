import { db } from "@/_platform/db";
import { type BulletinEntity, type BulletinInsert, BulletinTable } from "@/_platform/db/schema";
import { BadRequestError } from "@/_shared/server/errors";

import type { CreateBulletinInput, UserRole } from "../_domain/types";
import { resolveTeacherPostingSite } from "./siteAccess";

export async function createBulletin(
  data: CreateBulletinInput,
  userId: string,
  userRole: UserRole,
): Promise<BulletinEntity> {
  let scope = data.scope;
  let siteId = data.scope === "site" ? data.site_id : null;

  if (userRole === "teacher") {
    scope = "site";
    siteId = await resolveTeacherPostingSite(userId, data.site_id);
  }

  if (data.requires_initials && data.role_target !== "parent" && data.role_target !== "all") {
    throw new BadRequestError("requires_initials can only be enabled for parent-facing bulletins");
  }

  const newBulletin: BulletinInsert = {
    title: data.title,
    body: data.body || null,
    scope,
    site_id: siteId,
    role_target: data.role_target,
    requires_approval: data.requires_approval || false,
    requires_initials: data.requires_initials || false,
    approval_status: data.requires_approval ? "pending" : "approved",
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    publish_at: data.publish_at ? new Date(data.publish_at) : null,
    expire_at: data.expire_at ? new Date(data.expire_at) : null,
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const result = await db.insert(BulletinTable).values(newBulletin).returning();

  return result[0]!;
}
