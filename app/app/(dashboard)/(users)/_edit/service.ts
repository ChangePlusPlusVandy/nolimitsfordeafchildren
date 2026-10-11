import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  ParentProfileTable,
  TeacherProfileTable,
  type UserEntity,
  type UserInsert,
  UserTable,
} from "@/_platform/db/schema";
import { ConflictError } from "@/_shared/server/errors";

import { getByEmail, getUser } from "../_detail/service";
import type { UpdateUserInput } from "../_domain/types";

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserEntity | null> {
  const existingUser = await getUser(id);
  if (!existingUser) {
    return null;
  }

  if (input.email && input.email.toLowerCase() !== existingUser.email.toLowerCase()) {
    const emailTaken = await getByEmail(input.email);
    if (emailTaken) {
      throw new ConflictError("Email is already in use");
    }
  }

  const updateData: Partial<UserInsert> = { updated_at: new Date() };

  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.email !== undefined) {
    updateData.email = input.email.toLowerCase();
  }
  if (input.phone !== undefined) {
    updateData.phone = input.phone;
  }
  if (input.photo_url !== undefined) {
    updateData.photo_url = input.photo_url;
  }
  if (input.locale !== undefined) {
    updateData.locale = input.locale;
  }
  if (input.role !== undefined) {
    updateData.role = input.role;
  }
  if (input.is_active !== undefined) {
    updateData.is_active = input.is_active;
  }

  const result = await db.update(UserTable).set(updateData).where(eq(UserTable.id, id)).returning();

  if (input.role && input.role !== existingUser.role) {
    await handleRoleChange(id, existingUser.role, input.role);
  }

  return result[0] ?? null;
}

async function handleRoleChange(userId: string, _oldRole: string, newRole: string): Promise<void> {
  // Keep old profiles for historical records when a role changes.
  if (newRole === "teacher") {
    const existing = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(TeacherProfileTable).values({ user_id: userId });
    }
  }

  if (newRole === "parent") {
    const existing = await db
      .select()
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(ParentProfileTable).values({ user_id: userId });
    }
  }
}
