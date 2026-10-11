import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ParentProfileTable, type UserEntity, UserTable } from "@/_platform/db/schema";

import type { UpdateMeInput } from "../_domain/types";
import { addressFields, profileFields } from "./fields";

export async function updateProfile(
  userId: string,
  input: UpdateMeInput,
): Promise<UserEntity | null> {
  const updateData = profileFields(input);

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
        .set(addressFields(input))
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
