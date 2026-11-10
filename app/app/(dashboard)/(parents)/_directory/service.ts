import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  ParentStudentLinkTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  UserTable,
} from "@/_platform/db/schema";
import { buildPaginatedResponse, getPagination } from "@/_shared/server/pagination";

import { getParentProfileId } from "../_access/service";
import type { DirectoryPerson, PaginatedQuery, PaginatedResponse } from "../_children/types";

export async function directory(
  parentUserId: string,
  query: PaginatedQuery = {},
): Promise<PaginatedResponse<DirectoryPerson>> {
  const { page, limit, offset } = getPagination(query, 20, 100);

  const parentProfileId = await getParentProfileId(parentUserId);
  if (!parentProfileId) {
    return buildPaginatedResponse([], 0, page, limit);
  }

  const linkedSiteRows = await db
    .select({ site_id: StudentTable.site_id })
    .from(ParentStudentLinkTable)
    .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        isNull(ParentStudentLinkTable.revoked_at),
        eq(StudentTable.is_active, true),
      ),
    );

  const linkedSiteIds = Array.from(new Set(linkedSiteRows.map((row) => row.site_id)));

  if (linkedSiteIds.length === 0) {
    return buildPaginatedResponse([], 0, page, limit);
  }

  const admins = await db
    .select({
      id: UserTable.id,
      role: UserTable.role,
      name: UserTable.name,
      email: UserTable.email,
      bio: sql<string | null>`NULL`,
      photo_url: UserTable.photo_url,
    })
    .from(UserTable)
    .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)));

  const teachers = await db
    .select({
      id: UserTable.id,
      role: UserTable.role,
      name: UserTable.name,
      email: UserTable.email,
      bio: TeacherProfileTable.bio,
      photo_url: sql<
        string | null
      >`COALESCE(${TeacherProfileTable.photo_url}, ${UserTable.photo_url})`,
    })
    .from(TeacherProfileTable)
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .leftJoin(
      TeacherLocationTable,
      eq(TeacherLocationTable.teacher_profile_id, TeacherProfileTable.id),
    )
    .where(
      and(
        eq(UserTable.role, "teacher"),
        eq(UserTable.is_active, true),
        or(
          inArray(TeacherLocationTable.location_id, linkedSiteIds),
          inArray(TeacherProfileTable.primary_site_id, linkedSiteIds),
        ),
      ),
    );

  const combined = [...admins, ...teachers];

  const uniqueById = new Map<string, DirectoryPerson>();
  for (const person of combined) {
    if (person.role !== "administrator" && person.role !== "teacher") {
      continue;
    }

    uniqueById.set(person.id, {
      id: person.id,
      role: person.role,
      name: person.name,
      email: person.email,
      bio: person.bio,
      photo_url: person.photo_url,
    });
  }

  const items = Array.from(uniqueById.values()).sort((a, b) => a.name.localeCompare(b.name));
  const pagedItems = items.slice(offset, offset + limit);

  return buildPaginatedResponse(pagedItems, items.length, page, limit);
}
