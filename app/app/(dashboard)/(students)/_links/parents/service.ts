import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ParentProfileTable, ParentStudentLinkTable, UserTable } from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

export async function parents(
  studentId: string,
  query: { page?: number; limit?: number } = {},
  // eslint-disable-next-line typescript/no-explicit-any -- preserve joined parent payload contract
): Promise<PaginatedResponse<any>> {
  const { page, limit, offset } = getPagination(query, 20, 100);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(ParentStudentLinkTable)
    .where(
      and(
        eq(ParentStudentLinkTable.student_id, studentId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    );
  const total = countResult[0]?.count ?? 0;
  const parentLinks = await db
    .select({
      link_id: ParentStudentLinkTable.id,
      parent_id: ParentStudentLinkTable.parent_id,
      relationship: ParentStudentLinkTable.relationship,
      is_primary: ParentStudentLinkTable.is_primary,
      linked_at: ParentStudentLinkTable.linked_at,
      parent_name: UserTable.name,
      parent_email: UserTable.email,
      parent_phone: UserTable.phone,
      user_id: UserTable.id,
    })
    .from(ParentStudentLinkTable)
    .innerJoin(ParentProfileTable, eq(ParentStudentLinkTable.parent_id, ParentProfileTable.id))
    .innerJoin(UserTable, eq(ParentProfileTable.user_id, UserTable.id))
    .where(
      and(
        eq(ParentStudentLinkTable.student_id, studentId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    )
    .orderBy(desc(ParentStudentLinkTable.linked_at), desc(ParentStudentLinkTable.id))
    .limit(limit)
    .offset(offset);
  const items = parentLinks.map((p) => ({
    link_id: p.link_id,
    parent_id: p.parent_id,
    user_id: p.user_id,
    name: p.parent_name,
    email: p.parent_email,
    phone: p.parent_phone,
    relationship: p.relationship,
    is_primary: p.is_primary,
    linked_at: p.linked_at,
  }));

  return buildPaginatedResponse(items, total, page, limit);
}

// Parent linking accepts a user ID, not a parent profile ID.
export async function linkParent(
  studentId: string,
  parentUserId: string,
  relationship?: string,
  isPrimary?: boolean,
): Promise<{ ok: boolean; link_id: string }> {
  let parentProfileId: string;
  const parentProfile = await db
    .select({ id: ParentProfileTable.id })
    .from(ParentProfileTable)
    .where(eq(ParentProfileTable.user_id, parentUserId))
    .limit(1);

  if (!parentProfile || parentProfile.length === 0) {
    const [newProfile] = await db
      .insert(ParentProfileTable)
      .values({ user_id: parentUserId })
      .returning({ id: ParentProfileTable.id });

    if (!newProfile) {
      throw new Error("Failed to create parent profile");
    }
    parentProfileId = newProfile.id;
  } else {
    parentProfileId = parentProfile[0]!.id;
  }

  const existing = await db
    .select()
    .from(ParentStudentLinkTable)
    .where(
      and(
        eq(ParentStudentLinkTable.student_id, studentId),
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    )
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    return { ok: true, link_id: existing[0].id };
  }

  const [link] = await db
    .insert(ParentStudentLinkTable)
    .values({
      student_id: studentId,
      parent_id: parentProfileId,
      relationship,
      is_primary: isPrimary ?? false,
    })
    .returning();

  if (!link) {
    throw new Error("Failed to link parent");
  }

  return { ok: true, link_id: link.id };
}

export async function unlinkParent(
  studentId: string,
  parentUserId: string,
): Promise<{ ok: boolean }> {
  const parentProfile = await db
    .select({ id: ParentProfileTable.id })
    .from(ParentProfileTable)
    .where(eq(ParentProfileTable.user_id, parentUserId))
    .limit(1);

  if (!parentProfile || parentProfile.length === 0) {
    return { ok: true };
  }

  const parentProfileId = parentProfile[0]!.id;
  await db
    .update(ParentStudentLinkTable)
    .set({ revoked_at: new Date() })
    .where(
      and(
        eq(ParentStudentLinkTable.student_id, studentId),
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    );

  return { ok: true };
}
