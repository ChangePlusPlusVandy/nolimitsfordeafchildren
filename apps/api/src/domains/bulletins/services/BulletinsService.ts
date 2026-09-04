import { randomUUID } from "crypto";
import { Service } from "typedi";
import { eq, and, or, lte, gte, desc, isNull, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";
import {
  BulletinTable,
  BulletinAttachmentTable,
  BulletinAcknowledgementTable,
  BulletinViewTable,
  UserTable,
  LocationTable,
  TeacherProfileTable,
  TeacherLocationTable,
  ParentProfileTable,
  StudentTable,
  ParentStudentLinkTable,
  type BulletinEntity,
  type BulletinInsert,
  type BulletinAttachmentEntity,
  type BulletinAttachmentInsert,
  type BulletinAcknowledgementEntity,
  type BulletinAcknowledgementInsert,
  type BulletinViewEntity,
} from "@/db/schema";
import { getPresignedUploadUrl, getPublicUrl } from "@/s3";

export type BulletinScope = "global" | "site";
export type BulletinRoleTarget = "all" | "administrator" | "teacher" | "parent";
export type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

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
  requires_approval?: boolean;
  requires_initials?: boolean;
  publish_at?: Date | string | null;
  expire_at?: Date | string | null;
}

export interface UpdateBulletinInput {
  title?: string;
  body?: string;
  scope?: BulletinScope;
  site_id?: string | null;
  role_target?: BulletinRoleTarget;
  requires_approval?: boolean;
  requires_initials?: boolean;
  approval_status?: "draft" | "pending" | "approved" | "rejected";
  reviewed_by?: string | null;
  reviewed_at?: Date | string | null;
  review_notes?: string | null;
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
  acknowledgement_count?: number;
  acknowledged?: boolean;
  acknowledged_at?: Date | null;
  acknowledged_initials?: string | null;
}

export interface BulletinViewWithUser extends BulletinViewEntity {
  user: {
    id: string;
    name: string;
    email: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  };
}

export interface BulletinAcknowledgementWithUser extends BulletinAcknowledgementEntity {
  user: {
    id: string;
    name: string;
    email: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  };
}

export interface GetBulletinAttachmentUploadUrlInput {
  file_name: string;
  content_type: string;
}

export interface AcknowledgeBulletinInput {
  initials: string;
}

export interface ReviewBulletinInput {
  status: "approved" | "rejected";
  notes?: string;
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

  private async resolveTeacherPostingSite(
    userId: string,
    requestedSiteId?: string | null,
  ): Promise<string> {
    const teacherProfile = await db
      .select({ id: TeacherProfileTable.id, primary_site_id: TeacherProfileTable.primary_site_id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, userId))
      .limit(1);

    if (!teacherProfile[0]) {
      throw new Error("Teacher profile not found");
    }

    if (requestedSiteId) {
      if (teacherProfile[0].primary_site_id === requestedSiteId) {
        return requestedSiteId;
      }

      const assignedSite = await db
        .select({ id: TeacherLocationTable.id })
        .from(TeacherLocationTable)
        .where(
          and(
            eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0].id),
            eq(TeacherLocationTable.location_id, requestedSiteId),
          ),
        )
        .limit(1);

      if (assignedSite[0]) {
        return requestedSiteId;
      }

      throw new Error("Teacher is not assigned to the selected site");
    }

    if (teacherProfile[0].primary_site_id) {
      return teacherProfile[0].primary_site_id;
    }

    const fallbackSite = await db
      .select({ location_id: TeacherLocationTable.location_id })
      .from(TeacherLocationTable)
      .where(eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0].id))
      .orderBy(TeacherLocationTable.assigned_at)
      .limit(1);

    if (fallbackSite[0]?.location_id) {
      return fallbackSite[0].location_id;
    }

    throw new Error("Teacher must have an assigned site to create bulletins");
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

  async getAcknowledgementStats(bulletinId: string): Promise<{
    count: number;
    acknowledgements: BulletinAcknowledgementWithUser[];
  }> {
    const rows = await db
      .select({
        id: BulletinAcknowledgementTable.id,
        bulletin_id: BulletinAcknowledgementTable.bulletin_id,
        user_id: BulletinAcknowledgementTable.user_id,
        initials: BulletinAcknowledgementTable.initials,
        acknowledged_at: BulletinAcknowledgementTable.acknowledged_at,
        created_at: BulletinAcknowledgementTable.created_at,
        updated_at: BulletinAcknowledgementTable.updated_at,
        user_name: UserTable.name,
        user_email: UserTable.email,
        user_role: UserTable.role,
      })
      .from(BulletinAcknowledgementTable)
      .innerJoin(UserTable, eq(BulletinAcknowledgementTable.user_id, UserTable.id))
      .where(eq(BulletinAcknowledgementTable.bulletin_id, bulletinId))
      .orderBy(desc(BulletinAcknowledgementTable.acknowledged_at));

    return {
      count: rows.length,
      acknowledgements: rows.map((row) => ({
        id: row.id,
        bulletin_id: row.bulletin_id,
        user_id: row.user_id,
        initials: row.initials,
        acknowledged_at: row.acknowledged_at,
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
        userRole === "unassigned"
          ? eq(BulletinTable.role_target, "all")
          : or(eq(BulletinTable.role_target, "all"), eq(BulletinTable.role_target, userRole)),
      );

      conditions.push(eq(BulletinTable.approval_status, "approved"));
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
      .select({ count: sql<number>`count(*)` })
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
    let acknowledgementCountMap: Map<string, number> = new Map();
    let acknowledgedMap: Map<string, { acknowledged_at: Date; initials: string }> = new Map();

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

    // Combine bulletins with their attachments
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

  /**
   * Get a single bulletin by ID with attachments
   */
  async show(id: string, userId?: string): Promise<BulletinWithDetails | null> {
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

  /**
   * Create a new bulletin (admin only)
   */
  async create(data: CreateBulletinInput, userId: string, userRole: UserRole): Promise<BulletinEntity> {
    let scope = data.scope;
    let siteId = data.scope === "site" ? data.site_id : null;

    if (userRole === "teacher") {
      scope = "site";
      siteId = await this.resolveTeacherPostingSite(userId, data.site_id);
    }

    if (data.requires_initials && data.role_target !== "parent" && data.role_target !== "all") {
      throw new Error("requires_initials can only be enabled for parent-facing bulletins");
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

  /**
   * Update a bulletin (admin only)
   */
  async update(id: string, data: UpdateBulletinInput): Promise<BulletinEntity | null> {
    const existing = await db.select().from(BulletinTable).where(eq(BulletinTable.id, id)).limit(1);

    if (existing.length === 0) {
      return null;
    }

    const resolvedRoleTarget = data.role_target ?? existing[0]!.role_target;
    if (data.requires_initials && resolvedRoleTarget !== "parent" && resolvedRoleTarget !== "all") {
      throw new Error("requires_initials can only be enabled for parent-facing bulletins");
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

  async getAttachmentUploadUrl(
    input: GetBulletinAttachmentUploadUrlInput,
  ): Promise<{ upload_url: string; file_key: string; file_url: string }> {
    const extension = input.file_name.split(".").pop() || "bin";
    const fileKey = `bulletins/attachments/${randomUUID()}.${extension}`;
    const uploadUrl = await getPresignedUploadUrl(fileKey, input.content_type);
    const fileUrl = getPublicUrl(fileKey);

    return {
      upload_url: uploadUrl,
      file_key: fileKey,
      file_url: fileUrl,
    };
  }

  async acknowledgeBulletin(
    bulletinId: string,
    userId: string,
    input: AcknowledgeBulletinInput,
  ): Promise<BulletinAcknowledgementEntity> {
    const initials = input.initials.trim().toUpperCase();
    if (!initials) {
      throw new Error("Initials are required");
    }
    if (initials.length > 8) {
      throw new Error("Initials must be 8 characters or fewer");
    }

    const bulletin = await db
      .select({ id: BulletinTable.id, requires_initials: BulletinTable.requires_initials })
      .from(BulletinTable)
      .where(eq(BulletinTable.id, bulletinId))
      .limit(1);

    if (bulletin.length === 0) {
      throw new Error("Bulletin not found");
    }

    if (!bulletin[0]!.requires_initials) {
      throw new Error("This bulletin does not require initials acknowledgement");
    }

    const now = new Date();
    const payload: BulletinAcknowledgementInsert = {
      bulletin_id: bulletinId,
      user_id: userId,
      initials,
      acknowledged_at: now,
      created_at: now,
      updated_at: now,
    };

    const result = await db
      .insert(BulletinAcknowledgementTable)
      .values(payload)
      .onConflictDoUpdate({
        target: [BulletinAcknowledgementTable.bulletin_id, BulletinAcknowledgementTable.user_id],
        set: {
          initials,
          acknowledged_at: now,
          updated_at: now,
        },
      })
      .returning();

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

  async listPendingApproval(
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

  async reviewBulletin(
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
      throw new Error("Only pending bulletins can be reviewed");
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
}
