import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type TeacherProfileEntity,
  type TeacherProfileInsert,
  TeacherProfileTable,
  UserTable,
} from "@/_platform/db/schema";
import { BadRequestError, ConflictError, NotFoundError } from "@/_shared/server/errors";

import type { CreateTeacherInput } from "../_domain/types";

export async function createTeacher(input: CreateTeacherInput): Promise<TeacherProfileEntity> {
  const existing = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, input.user_id))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError("Teacher profile already exists for this user");
  }

  const user = await db.select().from(UserTable).where(eq(UserTable.id, input.user_id)).limit(1);

  if (user.length === 0) {
    throw new NotFoundError("User not found");
  }

  if (user[0]!.role !== "teacher") {
    throw new BadRequestError("User must have teacher role");
  }

  const newTeacher: TeacherProfileInsert = {
    user_id: input.user_id,
    primary_site_id: input.primary_site_id || null,
    bio: input.bio || null,
    photo_url: input.photo_url || null,
    qualifications: input.qualifications || null,
    credentials: input.credentials || null,
    age_group_specialty: input.age_group_specialty || "all_ages",
  };

  const result = await db.insert(TeacherProfileTable).values(newTeacher).returning();

  return result[0]!;
}
