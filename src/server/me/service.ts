import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  UserTable,
  TeacherProfileTable,
  ParentProfileTable,
  type UserEntity,
  type UserInsert,
} from "@/db/schema";

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  photo_url?: string;
  locale?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface UserProfileWithIds extends UserEntity {
  teacherProfileId?: string | null;
  parentProfileId?: string | null;
  parentAddress?: {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
}

export class MeService {
  /**
   * Get current user's profile with teacher/parent profile IDs
   */
  async getProfile(userId: string): Promise<UserProfileWithIds | null> {
    const users = await db.select().from(UserTable).where(eq(UserTable.id, userId)).limit(1);

    const user = users[0];
    if (!user) return null;

    // Get teacher profile ID if user is a teacher
    let teacherProfileId: string | null = null;
    if (user.role === "teacher") {
      const teacherProfiles = await db
        .select({ id: TeacherProfileTable.id })
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, userId))
        .limit(1);
      teacherProfileId = teacherProfiles[0]?.id ?? null;
    }

    // Get parent profile ID if user is a parent
    let parentProfileId: string | null = null;
    if (user.role === "parent") {
      const parentProfiles = await db
        .select({
          id: ParentProfileTable.id,
          address_line1: ParentProfileTable.address_line1,
          address_line2: ParentProfileTable.address_line2,
          city: ParentProfileTable.city,
          state: ParentProfileTable.state,
          postal_code: ParentProfileTable.postal_code,
        })
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, userId))
        .limit(1);
      parentProfileId = parentProfiles[0]?.id ?? null;

      return {
        ...user,
        teacherProfileId,
        parentProfileId,
        parentAddress: parentProfiles[0]
          ? {
              address_line1: parentProfiles[0].address_line1,
              address_line2: parentProfiles[0].address_line2,
              city: parentProfiles[0].city,
              state: parentProfiles[0].state,
              postal_code: parentProfiles[0].postal_code,
            }
          : null,
      };
    }

    return {
      ...user,
      teacherProfileId,
      parentProfileId,
      parentAddress: null,
    };
  }

  /**
   * Update current user's profile
   * Note: Users can only update certain fields (name, phone, locale)
   * They cannot change their own email or role
   */
  async updateProfile(userId: string, input: UpdateMeInput): Promise<UserEntity | null> {
    const updateData: Partial<UserInsert> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.photo_url !== undefined) updateData.photo_url = input.photo_url;
    if (input.locale !== undefined) updateData.locale = input.locale;

    if (
      input.address_line1 !== undefined ||
      input.address_line2 !== undefined ||
      input.city !== undefined ||
      input.state !== undefined ||
      input.postal_code !== undefined
    ) {
      const parentProfile = await db
        .select({ id: ParentProfileTable.id })
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, userId))
        .limit(1);

      if (parentProfile[0]) {
        await db
          .update(ParentProfileTable)
          .set({
            ...(input.address_line1 !== undefined
              ? { address_line1: input.address_line1 || null }
              : {}),
            ...(input.address_line2 !== undefined
              ? { address_line2: input.address_line2 || null }
              : {}),
            ...(input.city !== undefined ? { city: input.city || null } : {}),
            ...(input.state !== undefined ? { state: input.state || null } : {}),
            ...(input.postal_code !== undefined ? { postal_code: input.postal_code || null } : {}),
            updated_at: new Date(),
          })
          .where(eq(ParentProfileTable.id, parentProfile[0].id));
      }
    }

    const result = await db
      .update(UserTable)
      .set(updateData)
      .where(eq(UserTable.id, userId))
      .returning();

    return result[0] ?? null;
  }

  // Legacy methods for backward compatibility
  async getMe() {
    return { id: "me", role: "administrator", allowedSiteIds: [] };
  }

  async updateMe(_input: UpdateMeInput) {
    return { ok: true };
  }
}
