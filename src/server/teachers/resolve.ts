import { eq } from "drizzle-orm";
import { TeacherProfileTable } from "@/db/schema";
import { db } from "@/lib/db";
import { NotFoundError } from "@/server/shared/errors";

/**
 * Teacher route/API ids accept either:
 * - `teacher_profiles.id` (canonical), or
 * - `users.id` (legacy admin links from User Management).
 *
 * All schedule/location/student FKs use `teacher_profiles.id`.
 */
export async function resolveTeacherProfileId(id: string): Promise<string | null> {
  const byProfile = await db
    .select({ id: TeacherProfileTable.id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.id, id))
    .limit(1);

  if (byProfile[0]) {
    return byProfile[0].id;
  }

  const byUser = await db
    .select({ id: TeacherProfileTable.id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, id))
    .limit(1);

  return byUser[0]?.id ?? null;
}

export async function requireTeacherProfileId(id: string): Promise<string> {
  const profileId = await resolveTeacherProfileId(id);
  if (!profileId) {
    throw new NotFoundError("Teacher not found");
  }
  return profileId;
}
