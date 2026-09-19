import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";

import {
  ParentProfileTable,
  ParentStudentLinkTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { getParentProfileId } from "@/server/parents/parent-access";
import type {
  DirectoryPerson,
  PaginatedQuery,
  PaginatedResponse,
  ParentZipReportGroup,
  ParentZipReportItem,
} from "@/server/parents/types";
import { buildPaginatedResponse, getPagination } from "@/server/shared/pagination";

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

export async function zipReport(
  query: PaginatedQuery = {},
): Promise<PaginatedResponse<ParentZipReportGroup>> {
  const { page, limit, offset } = getPagination(query, 20, 100);

  const rows = await db
    .select({
      parent_user_id: UserTable.id,
      parent_name: UserTable.name,
      parent_email: UserTable.email,
      postal_code: ParentProfileTable.postal_code,
      city: ParentProfileTable.city,
      state: ParentProfileTable.state,
      student_id: ParentStudentLinkTable.student_id,
    })
    .from(ParentProfileTable)
    .innerJoin(UserTable, eq(ParentProfileTable.user_id, UserTable.id))
    .leftJoin(
      ParentStudentLinkTable,
      and(
        eq(ParentStudentLinkTable.parent_id, ParentProfileTable.id),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    )
    .where(and(eq(UserTable.role, "parent"), eq(UserTable.is_active, true)));

  const parentMap = new Map<
    string,
    {
      parent_user_id: string;
      parent_name: string;
      parent_email: string;
      postal_code: string;
      city: string | null;
      state: string | null;
      student_ids: Set<string>;
    }
  >();

  for (const row of rows) {
    const postalCode = row.postal_code?.trim();
    if (!postalCode) {
      continue;
    }

    const existing = parentMap.get(row.parent_user_id) ?? {
      parent_user_id: row.parent_user_id,
      parent_name: row.parent_name,
      parent_email: row.parent_email,
      postal_code: postalCode,
      city: row.city,
      state: row.state,
      student_ids: new Set<string>(),
    };

    if (row.student_id) {
      existing.student_ids.add(row.student_id);
    }

    parentMap.set(row.parent_user_id, existing);
  }

  const zipGroups = new Map<
    string,
    {
      postal_code: string;
      parents: ParentZipReportItem[];
    }
  >();

  for (const parent of parentMap.values()) {
    const parentItem: ParentZipReportItem = {
      parent_user_id: parent.parent_user_id,
      parent_name: parent.parent_name,
      parent_email: parent.parent_email,
      postal_code: parent.postal_code,
      city: parent.city,
      state: parent.state,
      linked_students: parent.student_ids.size,
    };

    const group = zipGroups.get(parent.postal_code) ?? {
      postal_code: parent.postal_code,
      parents: [],
    };

    group.parents.push(parentItem);
    zipGroups.set(parent.postal_code, group);
  }

  const items: ParentZipReportGroup[] = Array.from(zipGroups.values())
    .map((group) => ({
      postal_code: group.postal_code,
      parent_count: group.parents.length,
      student_count: group.parents.reduce((sum, parent) => sum + parent.linked_students, 0),
      parents: group.parents.sort((a, b) => a.parent_name.localeCompare(b.parent_name)),
    }))
    .sort((a, b) => a.postal_code.localeCompare(b.postal_code));

  const pagedItems = items.slice(offset, offset + limit);

  return buildPaginatedResponse(pagedItems, items.length, page, limit);
}
