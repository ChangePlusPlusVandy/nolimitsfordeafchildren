import { and, asc, eq } from "drizzle-orm";

import { LocationTable, TeacherLocationTable } from "@/db/schema";
import { db } from "@/lib/db";

export async function getTeacherLocations(
  teacherProfileId: string,
): Promise<Array<{ id: string; name: string }>> {
  const rows = await db
    .select({
      id: LocationTable.id,
      name: LocationTable.name,
    })
    .from(TeacherLocationTable)
    .innerJoin(LocationTable, eq(TeacherLocationTable.location_id, LocationTable.id))
    .where(eq(TeacherLocationTable.teacher_profile_id, teacherProfileId))
    .orderBy(asc(LocationTable.name));

  return rows;
}

export async function assignTeacherToLocation(
  teacherProfileId: string,
  locationId: string,
): Promise<void> {
  await db
    .insert(TeacherLocationTable)
    .values({
      teacher_profile_id: teacherProfileId,
      location_id: locationId,
    })
    .onConflictDoNothing();
}

export async function unassignTeacherFromLocation(
  teacherProfileId: string,
  locationId: string,
): Promise<void> {
  await db
    .delete(TeacherLocationTable)
    .where(
      and(
        eq(TeacherLocationTable.teacher_profile_id, teacherProfileId),
        eq(TeacherLocationTable.location_id, locationId),
      ),
    );
}

export async function isTeacherAssignedToLocation(
  teacherProfileId: string,
  locationId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: TeacherLocationTable.id })
    .from(TeacherLocationTable)
    .where(
      and(
        eq(TeacherLocationTable.teacher_profile_id, teacherProfileId),
        eq(TeacherLocationTable.location_id, locationId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}
