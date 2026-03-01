import { Service } from "typedi";
import { eq, ilike, or, desc, asc, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  UserTable,
  TeacherProfileTable,
  ParentProfileTable,
  type UserEntity,
  type UserInsert,
} from "@/db/schema";

export interface ListUsersQuery {
  search?: string;
  role?: "administrator" | "teacher" | "parent";
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "email" | "created_at";
  order?: "asc" | "desc";
}

export interface InviteUserInput {
  email: string;
  name: string;
  role: "administrator" | "teacher" | "parent";
  phone?: string;
  // For teachers
  primary_site_id?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  locale?: string;
  role?: "administrator" | "teacher" | "parent";
  is_active?: boolean;
}

@Service()
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
        or(ilike(UserTable.name, `%${query.search}%`), ilike(UserTable.email, `%${query.search}%`)),
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
      .select({ count: sql<number>`count(*)::int` })
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
   * Creates a user record with a placeholder auth0_id
   * The real auth0_id will be set when they first log in via Auth0
   */
  async invite(input: InviteUserInput): Promise<UserEntity> {
    // Check if email already exists
    const existing = await this.getByEmail(input.email);
    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Create user with placeholder auth0_id (will be updated on first login)
    const newUser: UserInsert = {
      auth0Id: `pending:${input.email}`, // Placeholder - will be replaced on first Auth0 login
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
