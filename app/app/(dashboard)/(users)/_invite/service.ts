import { db } from "@/_platform/db";
import {
  ParentProfileTable,
  TeacherProfileTable,
  type UserEntity,
  type UserInsert,
  UserTable,
} from "@/_platform/db/schema";
import { ConflictError } from "@/_shared/server/errors";

import { getByEmail } from "../_detail/service";
import type { InviteUserInput } from "../_domain/types";

export async function inviteUser(input: InviteUserInput): Promise<UserEntity> {
  const existing = await getByEmail(input.email);
  if (existing) {
    throw new ConflictError("User with this email already exists");
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

  if (input.role === "teacher") {
    await db.insert(TeacherProfileTable).values({
      user_id: user.id,
      primary_site_id: input.primary_site_id || null,
    });
  }

  if (input.role === "parent") {
    await db.insert(ParentProfileTable).values({ user_id: user.id });
  }

  // TODO: Send invitation email using Resend.
  return user;
}
