import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ParentProfileTable, TeacherProfileTable, UserTable } from "@/_platform/db/schema";

import type { UserProfileWithIds } from "../_domain/types";

export async function getProfile(userId: string): Promise<UserProfileWithIds | null> {
  const users = await db.select().from(UserTable).where(eq(UserTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) {
    return null;
  }

  let teacherProfileId: string | null = null;
  if (user.role === "teacher") {
    const teacherProfiles = await db
      .select({ id: TeacherProfileTable.id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, userId))
      .limit(1);
    teacherProfileId = teacherProfiles[0]?.id ?? null;
  }

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

  return { ...user, teacherProfileId, parentProfileId, parentAddress: null };
}
