import { desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type BulletinAttachmentEntity,
  BulletinAttachmentTable,
  type BulletinEntity,
  BulletinTable,
  LocationTable,
  UserTable,
} from "@/_platform/db/schema";
import { BadRequestError } from "@/_shared/server/errors";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type { BulletinWithDetails, ReviewBulletinInput } from "../_domain/types";

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
