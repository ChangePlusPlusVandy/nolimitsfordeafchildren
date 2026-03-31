import { Service } from "typedi";
import { eq, and, or, lte, gte, desc, isNull, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  BulletinTable,
  BulletinAttachmentTable,
  BulletinViewTable,
  UserTable,
  LocationTable,
  TeacherProfileTable,
  ParentProfileTable,
  StudentTable,
  ParentStudentLinkTable,
  type BulletinEntity,
  type BulletinInsert,
  type BulletinAttachmentEntity,
  type BulletinAttachmentInsert,
  type BulletinViewEntity,
} from "@/db/schema";

export type BulletinScope = "global" | "site";
export type BulletinRoleTarget = "all" | "administrator" | "teacher" | "parent";
export type UserRole = "administrator" | "teacher" | "parent";

export interface ListBulletinsQuery {
  siteId?: string;
  scope?: BulletinScope;
  roleTarget?: BulletinRoleTarget;
  includeExpired?: boolean;
  includeScheduled?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateBulletinInput {
  title: string;
  body?: string;
  scope: BulletinScope;
  site_id?: string | null;
  role_target: BulletinRoleTarget;
  publish_at?: Date | string | null;
  expire_at?: Date | string | null;
}

export interface UpdateBulletinInput {
  title?: string;
  body?: string;
  scope?: BulletinScope;
  site_id?: string | null;
  role_target?: BulletinRoleTarget;
  publish_at?: Date | string | null;
  expire_at?: Date | string | null;
}

export interface AddAttachmentInput {
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export interface BulletinWithDetails extends BulletinEntity {
  attachments: BulletinAttachmentEntity[];
  created_by_name?: string;
  site_name?: string;
  view_count?: number;
}

export interface BulletinViewWithUser extends BulletinViewEntity {
  user: {
    id: string;
    name: string;
    email: string;
    role: "administrator" | "teacher" | "parent";
  };
}

@Service()
export class BulletinsService {
  /**
   * Get user's site ID based on their role
   * - Teachers: primary_site_id from teacher_profiles
   * - Parents: site_id from first linked student
   * - Admins: null (can see all)
   */
  private async getUserSiteId(userId: string, role: UserRole): Promise<string | null> {
    if (role === "administrator") {
      return null; // Admins can see all
    }

    if (role === "teacher") {
      const teacherProfile = await db
        .select({ site_id: TeacherProfileTable.primary_site_id })
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, userId))
        .limit(1);

      return teacherProfile[0]?.site_id ?? null;
    }

    if (role === "parent") {
      // Get site from first linked student
      const parentProfile = await db
        .select({ id: ParentProfileTable.id })
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, userId))
        .limit(1);

      if (!parentProfile[0]) return null;

      const linkedStudent = await db
        .select({ site_id: StudentTable.site_id })
        .from(ParentStudentLinkTable)
        .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
        .where(
          and(
            eq(ParentStudentLinkTable.parent_id, parentProfile[0].id),
            isNull(ParentStudentLinkTable.revoked_at),
          ),
        )
        .limit(1);

      return linkedStudent[0]?.site_id ?? null;
    }

    return null;
  }

  async recordView(bulletinId: string, userId: string): Promise<void> {
    const existing = await db
      .select()
      .from(BulletinViewTable)
      .where(and(eq(BulletinViewTable.bulletin_id, bulletinId), eq(BulletinViewTable.user_id, userId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(BulletinViewTable)
        .set({
          last_viewed_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(BulletinViewTable.id, existing[0]!.id));
      return;
    }

    await db.insert(BulletinViewTable).values({
      bulletin_id: bulletinId,
      user_id: userId,
      viewed_at: new Date(),
      last_viewed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async getViewStats(bulletinId: string): Promise<{
    count: number;
    viewers: BulletinViewWithUser[];
  }> {
    const rows = await db
      .select({
        id: BulletinViewTable.id,
        bulletin_id: BulletinViewTable.bulletin_id,
        user_id: BulletinViewTable.user_id,
        viewed_at: BulletinViewTable.viewed_at,
        last_viewed_at: BulletinViewTable.last_viewed_at,
        created_at: BulletinViewTable.created_at,
        updated_at: BulletinViewTable.updated_at,
        user_name: UserTable.name,
        user_email: UserTable.email,
        user_role: UserTable.role,
      })
      .from(BulletinViewTable)
      .innerJoin(UserTable, eq(BulletinViewTable.user_id, UserTable.id))
      .where(eq(BulletinViewTable.bulletin_id, bulletinId))
      .orderBy(desc(BulletinViewTable.last_viewed_at));

    return {
      count: rows.length,
      viewers: rows.map((row) => ({
        id: row.id,
        bulletin_id: row.bulletin_id,
        user_id: row.user_id,
        viewed_at: row.viewed_at,
        last_viewed_at: row.last_viewed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          role: row.user_role,
        },
      })),
    };
  }

  /**
   * List bulletins filtered by user role and site
   *
   * Filtering logic:
   * - If scope='global', show to all
   * - If scope='site', only show to users at that site
   * - Filter by role_target: show if role_target='all' OR matches user's role
   * - Only show published bulletins (publish_at <= NOW or publish_at IS NULL)
   * - Only show non-expired bulletins (expire_at > NOW or expire_at IS NULL)
   *
   * Admin override: Admins can see all bulletins with filters
   */
  async index(
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

    // Admin can filter by site, non-admins filter by their own site
    if (userRole === "administrator") {
      // Admin can optionally filter by site
      if (query.siteId) {
        conditions.push(
          or(eq(BulletinTable.scope, "global"), eq(BulletinTable.site_id, query.siteId)),
        );
      }
      // Optional scope filter for admin
      if (query.scope) {
        conditions.push(eq(BulletinTable.scope, query.scope));
      }
      // Optional role target filter for admin
      if (query.roleTarget) {
        conditions.push(eq(BulletinTable.role_target, query.roleTarget));
      }
    } else {
      // Non-admins: filter by their site
      const userSiteId = await this.getUserSiteId(userId, userRole);

      // Scope filter: global OR (site AND matching site_id)
      if (userSiteId) {
        conditions.push(
          or(
            eq(BulletinTable.scope, "global"),
            and(eq(BulletinTable.scope, "site"), eq(BulletinTable.site_id, userSiteId)),
          ),
        );
      } else {
        // User has no site, only show global
        conditions.push(eq(BulletinTable.scope, "global"));
      }

      // Role target filter: 'all' OR matches user's role
      conditions.push(
        or(eq(BulletinTable.role_target, "all"), eq(BulletinTable.role_target, userRole)),
      );
    }

    // Time-based filters (unless admin wants to see all)
    if (!query.includeScheduled) {
      // Only show published bulletins
      conditions.push(or(isNull(BulletinTable.publish_at), lte(BulletinTable.publish_at, now)));
    }

    if (!query.includeExpired) {
      // Only show non-expired bulletins
      conditions.push(or(isNull(BulletinTable.expire_at), gte(BulletinTable.expire_at, now)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(BulletinTable)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get paginated bulletins with creator name and site name
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

    // Get attachments for all bulletins
    const bulletinIds = bulletins.map((b) => b.bulletin.id);

    let attachmentsMap: Map<string, BulletinAttachmentEntity[]> = new Map();
    let viewCountMap: Map<string, number> = new Map();

    if (bulletinIds.length > 0) {
      const attachments = await db
        .select()
        .from(BulletinAttachmentTable)
        .where(inArray(BulletinAttachmentTable.bulletin_id, bulletinIds));

      // Group attachments by bulletin_id
      for (const attachment of attachments) {
        const existing = attachmentsMap.get(attachment.bulletin_id) || [];
        existing.push(attachment);
        attachmentsMap.set(attachment.bulletin_id, existing);
      }

      const viewCounts = await db
        .select({
          bulletin_id: BulletinViewTable.bulletin_id,
          count: sql<number>`count(*)::int`,
        })
        .from(BulletinViewTable)
        .where(inArray(BulletinViewTable.bulletin_id, bulletinIds))
        .groupBy(BulletinViewTable.bulletin_id);

      for (const row of viewCounts) {
        viewCountMap.set(row.bulletin_id, row.count);
      }
    }

    // Combine bulletins with their attachments
    const items: BulletinWithDetails[] = bulletins.map((b) => ({
      ...b.bulletin,
      attachments: attachmentsMap.get(b.bulletin.id) || [],
      created_by_name: b.created_by_name ?? undefined,
      site_name: b.site_name ?? undefined,
      view_count: viewCountMap.get(b.bulletin.id) ?? 0,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single bulletin by ID with attachments
   */
  async show(id: string): Promise<BulletinWithDetails | null> {
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

    // Get attachments
    const attachments = await db
      .select()
      .from(BulletinAttachmentTable)
      .where(eq(BulletinAttachmentTable.bulletin_id, id));

    return {
      ...bulletin.bulletin,
      attachments,
      created_by_name: bulletin.created_by_name ?? undefined,
      site_name: bulletin.site_name ?? undefined,
      view_count: 0,
    };
  }

  /**
   * Create a new bulletin (admin only)
   */
  async create(data: CreateBulletinInput, userId: string): Promise<BulletinEntity> {
    const newBulletin: BulletinInsert = {
      title: data.title,
      body: data.body || null,
      scope: data.scope,
      site_id: data.scope === "site" ? data.site_id : null,
      role_target: data.role_target,
      publish_at: data.publish_at ? new Date(data.publish_at) : null,
      expire_at: data.expire_at ? new Date(data.expire_at) : null,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.insert(BulletinTable).values(newBulletin).returning();

    return result[0]!;
  }

  /**
   * Update a bulletin (admin only)
   */
  async update(id: string, data: UpdateBulletinInput): Promise<BulletinEntity | null> {
    const existing = await db.select().from(BulletinTable).where(eq(BulletinTable.id, id)).limit(1);

    if (existing.length === 0) {
      return null;
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

  /**
   * Delete a bulletin and its attachments (admin only)
   */
  async delete(id: string): Promise<boolean> {
    // First delete attachments
    await db.delete(BulletinAttachmentTable).where(eq(BulletinAttachmentTable.bulletin_id, id));

    // Then delete the bulletin
    const result = await db.delete(BulletinTable).where(eq(BulletinTable.id, id)).returning();

    return result.length > 0;
  }

  /**
   * Add an attachment to a bulletin (admin only)
   */
  async addAttachment(
    bulletinId: string,
    data: AddAttachmentInput,
  ): Promise<BulletinAttachmentEntity> {
    // Verify bulletin exists
    const bulletin = await db
      .select()
      .from(BulletinTable)
      .where(eq(BulletinTable.id, bulletinId))
      .limit(1);

    if (bulletin.length === 0) {
      throw new Error("Bulletin not found");
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

  /**
   * Delete an attachment (admin only)
   */
  async deleteAttachment(attachmentId: string): Promise<boolean> {
    const result = await db
      .delete(BulletinAttachmentTable)
      .where(eq(BulletinAttachmentTable.id, attachmentId))
      .returning();

    return result.length > 0;
  }
}
