import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { TeacherProfileTable } from "@/_platform/db/schema";
import { ForbiddenError } from "@/_shared/server/errors";

export async function requireTeacherProfileId(
  currentUserId: string,
  verb: string,
): Promise<string> {
  const teacherProfile = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, currentUserId))
    .limit(1);

  if (teacherProfile.length === 0) {
    throw new ForbiddenError(`Only teachers can ${verb} assessments`);
  }
  return teacherProfile[0].id;
}
