import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type TeacherProfileEntity,
  type TeacherProfileInsert,
  TeacherProfileTable,
} from "@/_platform/db/schema";

import type { UpdateTeacherInput } from "../_domain/types";
import { resolveTeacherProfileId } from "../_resolve/service";

export async function updateTeacher(
  id: string,
  input: UpdateTeacherInput,
): Promise<TeacherProfileEntity | null> {
  const profileId = await resolveTeacherProfileId(id);
  if (!profileId) {
    return null;
  }

  const existing = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.id, profileId))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const updateData: Partial<TeacherProfileInsert> = {
    updated_at: new Date(),
  };

  if (input.primary_site_id !== undefined) {
    updateData.primary_site_id = input.primary_site_id;
  }
  if (input.bio !== undefined) {
    updateData.bio = input.bio;
  }
  if (input.photo_url !== undefined) {
    updateData.photo_url = input.photo_url;
  }
  if (input.qualifications !== undefined) {
    updateData.qualifications = input.qualifications;
  }
  if (input.credentials !== undefined) {
    updateData.credentials = input.credentials;
  }
  if (input.age_group_specialty !== undefined) {
    updateData.age_group_specialty = input.age_group_specialty;
  }

  const result = await db
    .update(TeacherProfileTable)
    .set(updateData)
    .where(eq(TeacherProfileTable.id, profileId))
    .returning();

  return result[0] ?? null;
}
