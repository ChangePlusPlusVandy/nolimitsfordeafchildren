import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ParentProfileTable, ParentStudentLinkTable, UserTable } from "@/_platform/db/schema";
import { buildPaginatedResponse, getPagination } from "@/_shared/server/pagination";

import type {
  PaginatedQuery,
  PaginatedResponse,
  ParentZipReportGroup,
  ParentZipReportItem,
} from "../_children/types";

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
