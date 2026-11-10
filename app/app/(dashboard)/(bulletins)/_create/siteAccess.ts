import { and, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { TeacherLocationTable, TeacherProfileTable } from "@/_platform/db/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/_shared/server/errors";

export async function resolveTeacherPostingSite(
  userId: string,
  requestedSiteId?: string | null,
): Promise<string> {
  const teacherProfile = await db
    .select({ id: TeacherProfileTable.id, primary_site_id: TeacherProfileTable.primary_site_id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, userId))
    .limit(1);

  if (!teacherProfile[0]) {
    throw new NotFoundError("Teacher profile not found");
  }

  if (requestedSiteId) {
    if (teacherProfile[0].primary_site_id === requestedSiteId) {
      return requestedSiteId;
    }

    const assignedSite = await db
      .select({ id: TeacherLocationTable.id })
      .from(TeacherLocationTable)
      .where(
        and(
          eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0].id),
          eq(TeacherLocationTable.location_id, requestedSiteId),
        ),
      )
      .limit(1);

    if (assignedSite[0]) {
      return requestedSiteId;
    }

    throw new ForbiddenError("Teacher is not assigned to the selected site");
  }

  if (teacherProfile[0].primary_site_id) {
    return teacherProfile[0].primary_site_id;
  }

  const fallbackSite = await db
    .select({ location_id: TeacherLocationTable.location_id })
    .from(TeacherLocationTable)
    .where(eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0].id))
    .orderBy(TeacherLocationTable.assigned_at)
    .limit(1);

  if (fallbackSite[0]?.location_id) {
    return fallbackSite[0].location_id;
  }

  throw new BadRequestError("Teacher must have an assigned site to create bulletins");
}
