import { and, eq, gte, isNull, lte, or, type SQL } from "drizzle-orm";

import { db } from "@/_platform/db";
import { BulletinAttachmentTable, BulletinTable, type UserEntity } from "@/_platform/db/schema";
import { ForbiddenError } from "@/_shared/server/errors";

import type { UserRole } from "../_domain/types";
import { getUserSiteId } from "./siteAccess";

/**
 * Site, role, and approval conditions for a non-administrator. Shared by the
 * board listing and attachment downloads so both apply the same rules.
 */
export async function memberVisibilityConditions(
  userRole: UserRole,
  userId: string,
): Promise<(SQL | undefined)[]> {
  const userSiteId = await getUserSiteId(userId, userRole);

  return [
    userSiteId
      ? or(
          eq(BulletinTable.scope, "global"),
          and(eq(BulletinTable.scope, "site"), eq(BulletinTable.site_id, userSiteId)),
        )
      : eq(BulletinTable.scope, "global"),
    userRole === "unassigned"
      ? eq(BulletinTable.role_target, "all")
      : or(eq(BulletinTable.role_target, "all"), eq(BulletinTable.role_target, userRole)),
    eq(BulletinTable.approval_status, "approved"),
  ];
}

export function publishedCondition(now: Date) {
  return or(isNull(BulletinTable.publish_at), lte(BulletinTable.publish_at, now));
}

export function unexpiredCondition(now: Date) {
  return or(isNull(BulletinTable.expire_at), gte(BulletinTable.expire_at, now));
}

/**
 * Throws ForbiddenError unless the attachment belongs to a bulletin the board
 * shows this user by default (visible, published, unexpired). Unknown files are
 * denied the same way, so existence never leaks.
 */
export async function assertCanViewAttachmentFile(
  fileUrl: string,
  currentUser: Pick<UserEntity, "id" | "role">,
): Promise<void> {
  if (currentUser.role === "administrator") {
    return;
  }

  const now = new Date();
  const [attachment] = await db
    .select({ id: BulletinAttachmentTable.id })
    .from(BulletinAttachmentTable)
    .innerJoin(BulletinTable, eq(BulletinAttachmentTable.bulletin_id, BulletinTable.id))
    .where(
      and(
        eq(BulletinAttachmentTable.file_url, fileUrl),
        ...(await memberVisibilityConditions(currentUser.role, currentUser.id)),
        publishedCondition(now),
        unexpiredCondition(now),
      ),
    )
    .limit(1);

  if (!attachment) {
    throw new ForbiddenError("You cannot access this attachment");
  }
}
