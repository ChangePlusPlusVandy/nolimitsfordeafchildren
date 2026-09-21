import { desc, eq, inArray, sql } from "drizzle-orm";

import {
  type BulletinAttachmentEntity,
  BulletinAttachmentTable,
  type BulletinEntity,
  type BulletinInsert,
  BulletinTable,
  LocationTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { resolveTeacherPostingSite } from "@/server/bulletins/siteAccess";
import type {
  BulletinWithDetails,
  CreateBulletinInput,
  ReviewBulletinInput,
  UpdateBulletinInput,
  UserRole,
} from "@/server/bulletins/types";
import { BadRequestError } from "@/server/shared/errors";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/server/shared/pagination";

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

  if (data.title !== undefined) updateData.title = data.title;
  if (data.body !== undefined) updateData.body = data.body;
  if (data.scope !== undefined) updateData.scope = data.scope;
  if (data.site_id !== undefined) {
    updateData.site_id =
      data.scope === "site" || existing[0]!.scope === "site" ? data.site_id : null;
  }
  if (data.role_target !== undefined) updateData.role_target = data.role_target;
  if (data.requires_approval !== undefined) updateData.requires_approval = data.requires_approval;
  if (data.requires_initials !== undefined) updateData.requires_initials = data.requires_initials;
  if (data.approval_status !== undefined) updateData.approval_status = data.approval_status;
  if (data.reviewed_by !== undefined) updateData.reviewed_by = data.reviewed_by;
  if (data.reviewed_at !== undefined) {
    updateData.reviewed_at = data.reviewed_at ? new Date(data.reviewed_at) : null;
  }
  if (data.review_notes !== undefined) updateData.review_notes = data.review_notes;
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

export async function deleteBulletin(id: string): Promise<boolean> {
  await db.delete(BulletinAttachmentTable).where(eq(BulletinAttachmentTable.bulletin_id, id));

  const result = await db.delete(BulletinTable).where(eq(BulletinTable.id, id)).returning();

  return result.length > 0;
}

export async function listPendingApprovalBulletins(
  query: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<BulletinWithDetails>> {
  const { page, limit, offset } = getPagination(query, 20, 100);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(BulletinTable)
    .where(eq(BulletinTable.approval_status, "pending"));

  const total = countResult[0]?.count ?? 0;

  const rows = await db
    .select({
      bulletin: BulletinTable,
      created_by_name: UserTable.name,
      site_name: LocationTable.name,
    })
    .from(BulletinTable)
    .leftJoin(UserTable, eq(BulletinTable.created_by, UserTable.id))
    .leftJoin(LocationTable, eq(BulletinTable.site_id, LocationTable.id))
    .where(eq(BulletinTable.approval_status, "pending"))
    .orderBy(desc(BulletinTable.created_at), desc(BulletinTable.id))
    .limit(limit)
    .offset(offset);

  const bulletinIds = rows.map((row) => row.bulletin.id);
  const attachmentsMap = new Map<string, BulletinAttachmentEntity[]>();

  if (bulletinIds.length > 0) {
    const attachments = await db
      .select()
      .from(BulletinAttachmentTable)
      .where(inArray(BulletinAttachmentTable.bulletin_id, bulletinIds));

    for (const attachment of attachments) {
      const list = attachmentsMap.get(attachment.bulletin_id) ?? [];
      list.push(attachment);
      attachmentsMap.set(attachment.bulletin_id, list);
    }
  }

  const items = rows.map((row) => ({
    ...row.bulletin,
    attachments: attachmentsMap.get(row.bulletin.id) ?? [],
    created_by_name: row.created_by_name ?? undefined,
    site_name: row.site_name ?? undefined,
    view_count: 0,
  }));

  return buildPaginatedResponse(items, total, page, limit);
}

export async function reviewBulletin(
  bulletinId: string,
  reviewerUserId: string,
  input: ReviewBulletinInput,
): Promise<BulletinEntity | null> {
  const existing = await db
    .select()
    .from(BulletinTable)
    .where(eq(BulletinTable.id, bulletinId))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  if (existing[0]!.approval_status !== "pending") {
    throw new BadRequestError("Only pending bulletins can be reviewed");
  }

  const result = await db
    .update(BulletinTable)
    .set({
      approval_status: input.status,
      reviewed_by: reviewerUserId,
      reviewed_at: new Date(),
      review_notes: input.notes || null,
      updated_at: new Date(),
    })
    .where(eq(BulletinTable.id, bulletinId))
    .returning();

  return result[0] ?? null;
}
