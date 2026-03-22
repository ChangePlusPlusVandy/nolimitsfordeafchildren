import { Service } from "typedi";
import { eq } from "drizzle-orm";
import { db } from "@/db";
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
  locale?: string;
}

export interface UserProfileWithIds extends UserEntity {
  teacherProfileId?: string | null;
  parentProfileId?: string | null;
}

@Service()
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
        .select({ id: ParentProfileTable.id })
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, userId))
        .limit(1);
      parentProfileId = parentProfiles[0]?.id ?? null;
    }

    return {
      ...user,
      teacherProfileId,
      parentProfileId,
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
    if (input.locale !== undefined) updateData.locale = input.locale;

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
