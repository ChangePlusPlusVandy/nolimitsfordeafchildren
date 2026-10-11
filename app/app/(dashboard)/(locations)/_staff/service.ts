import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  ParentProfileTable,
  ParentStudentLinkTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  type UserEntity,
  UserTable,
} from "@/_platform/db/schema";
import { ForbiddenError, NotFoundError } from "@/_shared/server/errors";

import { getLocation } from "../_detail/service";
import type { LocationStaffMember, LocationStaffResponse } from "../_domain/types";

export async function staffByLocation(
  siteId: string,
  currentUser: UserEntity,
): Promise<LocationStaffResponse> {
  const location = await getLocation(siteId);
  if (!location) {
    throw new NotFoundError("Location not found");
  }

  if (currentUser.role === "parent") {
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, currentUser.id))
      .limit(1);

    if (parentProfile.length === 0) {
      throw new ForbiddenError("Parent profile not found");
    }

    const linkedChildren = await db
      .select({ id: StudentTable.id })
      .from(ParentStudentLinkTable)
      .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          isNull(ParentStudentLinkTable.revoked_at),
          eq(StudentTable.site_id, siteId),
        ),
      )
      .limit(1);

    if (linkedChildren.length === 0) {
      throw new ForbiddenError("You do not have children enrolled at this location");
    }
  }

  const admins = await db
    .select({
      id: UserTable.id,
      name: UserTable.name,
      email: UserTable.email,
      phone: UserTable.phone,
      photo_url: UserTable.photo_url,
    })
    .from(UserTable)
    .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)))
    .orderBy(asc(UserTable.name));

  const teachers = await db
    .select({
      id: UserTable.id,
      name: UserTable.name,
      email: UserTable.email,
      phone: UserTable.phone,
      photo_url: UserTable.photo_url,
      bio: TeacherProfileTable.bio,
    })
    .from(TeacherLocationTable)
    .innerJoin(
      TeacherProfileTable,
      eq(TeacherLocationTable.teacher_profile_id, TeacherProfileTable.id),
    )
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .where(and(eq(TeacherLocationTable.location_id, siteId), eq(UserTable.is_active, true)))
    .orderBy(asc(UserTable.name));

  const staff: LocationStaffMember[] = [
    ...admins.map((a) => ({
      id: a.id,
      name: a.name,
      role: "administrator" as const,
      email: a.email,
      phone: a.phone,
      photo_url: a.photo_url,
      bio: null,
    })),
    ...teachers.map((t) => ({
      id: t.id,
      name: t.name,
      role: "teacher" as const,
      email: t.email,
      phone: t.phone,
      photo_url: t.photo_url,
      bio: t.bio,
    })),
  ];

  return { location_id: location.id, location_name: location.name, staff };
}
