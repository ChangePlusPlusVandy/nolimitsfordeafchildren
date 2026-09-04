import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import {
  ParentProfileTable,
  ParentStudentLinkTable,
  StudentTable,
  TeacherProfileTable,
  type UserEntity,
  type UserInsert,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";

export interface ListUsersQuery {
  search?: string;
  role?: "administrator" | "teacher" | "parent" | "unassigned";
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "email" | "created_at";
  order?: "asc" | "desc";
}

export interface InviteUserInput {
  email: string;
  name: string;
  role: "administrator" | "teacher" | "parent" | "unassigned";
  phone?: string;
  // For teachers
  primary_site_id?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  locale?: string;
  role?: "administrator" | "teacher" | "parent" | "unassigned";
  is_active?: boolean;
}

export interface UserWithLinkedStudents extends UserEntity {
  linked_students: Array<{
    link_id: string;
    student_id: string;
    initials: string;
    first_name: string;
    last_name: string;
    relationship: string | null;
    is_primary: boolean;
    linked_at: Date;
  }>;
}

export class UsersService {
  /**
   * List users with filtering, pagination, and sorting
   */
  async index(query: ListUsersQuery): Promise<{
    items: UserEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (query.search) {
      conditions.push(
        or(like(UserTable.name, `%${query.search}%`), like(UserTable.email, `%${query.search}%`)),
      );
    }

    if (query.role) {
      conditions.push(eq(UserTable.role, query.role));
    }

    if (query.is_active !== undefined) {
      conditions.push(eq(UserTable.is_active, query.is_active));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(UserTable)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Determine sort column and order
    const sortColumn =
      query.sort === "email"
        ? UserTable.email
        : query.sort === "created_at"
          ? UserTable.created_at
          : UserTable.name;

    const orderFn = query.order === "desc" ? desc : asc;

    // Get paginated results
    const items = await db
      .select()
      .from(UserTable)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single user by ID
   */
  async show(id: string): Promise<UserEntity | null> {
    const users = await db.select().from(UserTable).where(eq(UserTable.id, id)).limit(1);

    return users[0] ?? null;
  }

  async showWithLinkedStudents(id: string): Promise<UserWithLinkedStudents | null> {
    const user = await this.show(id);
    if (!user) {
      return null;
    }

    if (user.role !== "parent") {
      return {
        ...user,
        linked_students: [],
      };
    }

    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, id))
      .limit(1);

    if (parentProfile.length === 0) {
      return {
        ...user,
        linked_students: [],
      };
    }

    const links = await db
      .select({
        link_id: ParentStudentLinkTable.id,
        student_id: StudentTable.id,
        initials: StudentTable.initials,
        first_name: StudentTable.first_name,
        last_name: StudentTable.last_name,
        relationship: ParentStudentLinkTable.relationship,
        is_primary: ParentStudentLinkTable.is_primary,
        linked_at: ParentStudentLinkTable.linked_at,
      })
      .from(ParentStudentLinkTable)
      .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      )
      .orderBy(asc(StudentTable.last_name), asc(StudentTable.first_name));

    return {
      ...user,
      linked_students: links,
    };
  }

  async linkStudentToParentUser(
    parentUserId: string,
    studentId: string,
    relationship?: string,
    isPrimary?: boolean,
  ): Promise<{ ok: boolean; link_id: string }> {
    let parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (parentProfile.length === 0) {
      const [created] = await db
        .insert(ParentProfileTable)
        .values({ user_id: parentUserId })
        .returning({ id: ParentProfileTable.id });

      if (!created) {
        throw new Error("Failed to create parent profile");
      }

      parentProfile = [created];
    }

    const existing = await db
      .select({ id: ParentStudentLinkTable.id })
      .from(ParentStudentLinkTable)
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          eq(ParentStudentLinkTable.student_id, studentId),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return { ok: true, link_id: existing[0]!.id };
    }

    const [link] = await db
      .insert(ParentStudentLinkTable)
      .values({
        parent_id: parentProfile[0]!.id,
        student_id: studentId,
        relationship: relationship ?? null,
        is_primary: isPrimary ?? false,
      })
      .returning({ id: ParentStudentLinkTable.id });

    if (!link) {
      throw new Error("Failed to link student to parent");
    }

    return { ok: true, link_id: link.id };
  }

  async unlinkStudentFromParentUser(
    parentUserId: string,
    studentId: string,
  ): Promise<{ ok: boolean }> {
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (parentProfile.length === 0) {
      return { ok: true };
    }

    await db
      .update(ParentStudentLinkTable)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          eq(ParentStudentLinkTable.student_id, studentId),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      );

    return { ok: true };
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<UserEntity | null> {
    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email.toLowerCase()))
      .limit(1);

    return users[0] ?? null;
  }

  /**
   * Invite a new user
   * Creates a user record that will be linked to an auth account on first sign-in.
   */
  async invite(input: InviteUserInput): Promise<UserEntity> {
    // Check if email already exists
    const existing = await this.getByEmail(input.email);
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const newUser: UserInsert = {
      authUserId: null,
      email: input.email.toLowerCase(),
      name: input.name,
      phone: input.phone || null,
      locale: "en-US",
      role: input.role,
      is_active: true,
    };

    const result = await db.insert(UserTable).values(newUser).returning();

    const user = result[0]!;

    // If teacher, create teacher profile
    if (input.role === "teacher") {
      await db.insert(TeacherProfileTable).values({
        user_id: user.id,
        primary_site_id: input.primary_site_id || null,
      });
    }

    // If parent, create parent profile
    if (input.role === "parent") {
      await db.insert(ParentProfileTable).values({
        user_id: user.id,
      });
    }

    // TODO: Send invitation email using Resend

    return user;
  }

  /**
   * Update user details
   */
  async update(id: string, input: UpdateUserInput): Promise<UserEntity | null> {
    const existingUser = await this.show(id);
    if (!existingUser) {
      return null;
    }

    // If changing email, check it's not taken
    if (input.email && input.email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailTaken = await this.getByEmail(input.email);
      if (emailTaken) {
        throw new Error("Email is already in use");
      }
    }

    const updateData: Partial<UserInsert> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email.toLowerCase();
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.photo_url !== undefined) updateData.photo_url = input.photo_url;
    if (input.locale !== undefined) updateData.locale = input.locale;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const result = await db
      .update(UserTable)
      .set(updateData)
      .where(eq(UserTable.id, id))
      .returning();

    // Handle role change - create/delete profile tables as needed
    if (input.role && input.role !== existingUser.role) {
      await this.handleRoleChange(id, existingUser.role, input.role);
    }

    return result[0] ?? null;
  }

  /**
   * Disable a user (soft delete)
   */
  async disable(id: string): Promise<UserEntity | null> {
    return this.update(id, { is_active: false });
  }

  /**
   * Enable a user
   */
  async enable(id: string): Promise<UserEntity | null> {
    return this.update(id, { is_active: true });
  }

  /**
   * Handle profile table changes when role changes
   */
  private async handleRoleChange(userId: string, oldRole: string, newRole: string): Promise<void> {
    // If becoming a teacher, create teacher profile if not exists
    if (newRole === "teacher") {
      const existing = await db
        .select()
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, userId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(TeacherProfileTable).values({
          user_id: userId,
        });
      }
    }

    // If becoming a parent, create parent profile if not exists
    if (newRole === "parent") {
      const existing = await db
        .select()
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, userId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(ParentProfileTable).values({
          user_id: userId,
        });
      }
    }

    // Note: We don't delete old profiles to preserve historical data
  }
}
