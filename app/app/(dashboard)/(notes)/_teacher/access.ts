import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { TeacherProfileTable } from "@/_platform/db/schema";
import { HttpError } from "@/_shared/server/errors";

const FORBIDDEN_STATUS = 403;

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
    throw new HttpError(FORBIDDEN_STATUS, "FORBIDDEN", `Only teachers can ${verb} session notes`);
  }
  return teacherProfile[0].id;
}
