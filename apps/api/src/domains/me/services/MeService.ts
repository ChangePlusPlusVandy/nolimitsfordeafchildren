import { Service } from "typedi";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { UserTable, type UserEntity, type UserInsert } from "@/db/schema";

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  locale?: string;
}

@Service()
export class MeService {
  /**
   * Get current user's profile
   */
  async getProfile(userId: string): Promise<UserEntity | null> {
    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, userId))
      .limit(1);

    return users[0] ?? null;
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
