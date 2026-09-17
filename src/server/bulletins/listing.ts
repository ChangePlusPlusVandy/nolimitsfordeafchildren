import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import {
  BulletinAcknowledgementTable,
  type BulletinAttachmentEntity,
  BulletinAttachmentTable,
  BulletinTable,
  BulletinViewTable,
  LocationTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { getUserSiteId } from "@/server/bulletins/siteAccess";
import type { BulletinWithDetails, ListBulletinsQuery, UserRole } from "@/server/bulletins/types";

export async function listBulletins(
  query: ListBulletinsQuery,
  userRole: UserRole,
  userId: string,
): Promise<{
  items: BulletinWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const offset = (page - 1) * limit;
  const now = new Date();

  const conditions = [];

  if (userRole === "administrator") {
    if (query.siteId) {
      conditions.push(
        or(eq(BulletinTable.scope, "global"), eq(BulletinTable.site_id, query.siteId)),
      );
    }
    if (query.scope) {
      conditions.push(eq(BulletinTable.scope, query.scope));
    }
    if (query.roleTarget) {
      conditions.push(eq(BulletinTable.role_target, query.roleTarget));
    }
  } else {
    const userSiteId = await getUserSiteId(userId, userRole);

    if (userSiteId) {
      conditions.push(
        or(
          eq(BulletinTable.scope, "global"),
          and(eq(BulletinTable.scope, "site"), eq(BulletinTable.site_id, userSiteId)),
        ),
      );
    } else {
      conditions.push(eq(BulletinTable.scope, "global"));
    }

    conditions.push(
      userRole === "unassigned"
        ? eq(BulletinTable.role_target, "all")
        : or(eq(BulletinTable.role_target, "all"), eq(BulletinTable.role_target, userRole)),
    );

    conditions.push(eq(BulletinTable.approval_status, "approved"));
  }

  if (!query.includeScheduled) {
    conditions.push(or(isNull(BulletinTable.publish_at), lte(BulletinTable.publish_at, now)));
  }

  if (!query.includeExpired) {
    conditions.push(or(isNull(BulletinTable.expire_at), gte(BulletinTable.expire_at, now)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(BulletinTable)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  const bulletins = await db
    .select({
      bulletin: BulletinTable,
      created_by_name: UserTable.name,
      site_name: LocationTable.name,
    })
    .from(BulletinTable)
    .leftJoin(UserTable, eq(BulletinTable.created_by, UserTable.id))
    .leftJoin(LocationTable, eq(BulletinTable.site_id, LocationTable.id))
    .where(whereClause)
    .orderBy(desc(BulletinTable.publish_at), desc(BulletinTable.created_at))
    .limit(limit)
    .offset(offset);

  const bulletinIds = bulletins.map((b) => b.bulletin.id);

  const attachmentsMap: Map<string, BulletinAttachmentEntity[]> = new Map();
  const viewCountMap: Map<string, number> = new Map();
  const acknowledgementCountMap: Map<string, number> = new Map();
  const acknowledgedMap: Map<string, { acknowledged_at: Date; initials: string }> = new Map();

  if (bulletinIds.length > 0) {
    const attachments = await db
      .select()
      .from(BulletinAttachmentTable)
      .where(inArray(BulletinAttachmentTable.bulletin_id, bulletinIds));

    for (const attachment of attachments) {
      const existing = attachmentsMap.get(attachment.bulletin_id) || [];
      existing.push(attachment);
      attachmentsMap.set(attachment.bulletin_id, existing);
    }

    const viewCounts = await db
      .select({
        bulletin_id: BulletinViewTable.bulletin_id,
        count: sql<number>`count(*)`,
      })
      .from(BulletinViewTable)
      .where(inArray(BulletinViewTable.bulletin_id, bulletinIds))
      .groupBy(BulletinViewTable.bulletin_id);

    for (const row of viewCounts) {
      viewCountMap.set(row.bulletin_id, row.count);
    }

    const acknowledgementCounts = await db
      .select({
        bulletin_id: BulletinAcknowledgementTable.bulletin_id,
        count: sql<number>`count(*)`,
      })
      .from(BulletinAcknowledgementTable)
      .where(inArray(BulletinAcknowledgementTable.bulletin_id, bulletinIds))
      .groupBy(BulletinAcknowledgementTable.bulletin_id);

    for (const row of acknowledgementCounts) {
      acknowledgementCountMap.set(row.bulletin_id, row.count);
    }

    if (userRole === "parent") {
      const acknowledgements = await db
        .select({
          bulletin_id: BulletinAcknowledgementTable.bulletin_id,
          acknowledged_at: BulletinAcknowledgementTable.acknowledged_at,
          initials: BulletinAcknowledgementTable.initials,
        })
        .from(BulletinAcknowledgementTable)
        .where(
          and(
            inArray(BulletinAcknowledgementTable.bulletin_id, bulletinIds),
            eq(BulletinAcknowledgementTable.user_id, userId),
          ),
        );

      for (const row of acknowledgements) {
        acknowledgedMap.set(row.bulletin_id, {
          acknowledged_at: row.acknowledged_at,
          initials: row.initials,
        });
      }
    }
  }

  const items: BulletinWithDetails[] = bulletins.map((b) => {
    const parentAcknowledgement = acknowledgedMap.get(b.bulletin.id);

    return {
      ...b.bulletin,
      attachments: attachmentsMap.get(b.bulletin.id) || [],
      created_by_name: b.created_by_name ?? undefined,
      site_name: b.site_name ?? undefined,
      view_count: viewCountMap.get(b.bulletin.id) ?? 0,
      acknowledgement_count: acknowledgementCountMap.get(b.bulletin.id) ?? 0,
      acknowledged: Boolean(parentAcknowledgement),
      acknowledged_at: parentAcknowledgement?.acknowledged_at ?? null,
      acknowledged_initials: parentAcknowledgement?.initials ?? null,
    };
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function showBulletin(
  id: string,
  userId?: string,
): Promise<BulletinWithDetails | null> {
  const result = await db
    .select({
      bulletin: BulletinTable,
      created_by_name: UserTable.name,
      site_name: LocationTable.name,
    })
    .from(BulletinTable)
    .leftJoin(UserTable, eq(BulletinTable.created_by, UserTable.id))
    .leftJoin(LocationTable, eq(BulletinTable.site_id, LocationTable.id))
    .where(eq(BulletinTable.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const bulletin = result[0]!;

  const attachments = await db
    .select()
    .from(BulletinAttachmentTable)
    .where(eq(BulletinAttachmentTable.bulletin_id, id));

  const acknowledgementCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(BulletinAcknowledgementTable)
    .where(eq(BulletinAcknowledgementTable.bulletin_id, id));

  let acknowledgedAt: Date | null = null;
  let acknowledgedInitials: string | null = null;
  if (userId) {
    const ack = await db
      .select({
        acknowledged_at: BulletinAcknowledgementTable.acknowledged_at,
        initials: BulletinAcknowledgementTable.initials,
      })
      .from(BulletinAcknowledgementTable)
      .where(
        and(
          eq(BulletinAcknowledgementTable.bulletin_id, id),
          eq(BulletinAcknowledgementTable.user_id, userId),
        ),
      )
      .limit(1);

    acknowledgedAt = ack[0]?.acknowledged_at ?? null;
    acknowledgedInitials = ack[0]?.initials ?? null;
  }

  return {
    ...bulletin.bulletin,
    attachments,
    created_by_name: bulletin.created_by_name ?? undefined,
    site_name: bulletin.site_name ?? undefined,
    view_count: 0,
    acknowledgement_count: acknowledgementCountResult[0]?.count ?? 0,
    acknowledged: Boolean(acknowledgedAt),
    acknowledged_at: acknowledgedAt,
    acknowledged_initials: acknowledgedInitials,
  };
}
