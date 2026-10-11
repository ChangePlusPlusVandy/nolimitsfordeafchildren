import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ParentProfileTable, ParentStudentLinkTable } from "@/_platform/db/schema";

export async function linkStudent(
  parentUserId: string,
  studentId: string,
  relationship?: string,
  isPrimary?: boolean,
): Promise<{ ok: boolean; link_id: string }> {
  let parentProfile = await db
    .select({ id: ParentProfileTable.id })
    .from(ParentProfileTable)
    .where(eq(ParentProfileTable.user_id, parentUserId))
    .limit(1);

  if (parentProfile.length === 0) {
    const [created] = await db
      .insert(ParentProfileTable)
      .values({ user_id: parentUserId })
      .returning({ id: ParentProfileTable.id });

    if (!created) {
      throw new Error("Failed to create parent profile");
    }

    parentProfile = [created];
  }

  const existing = await db
    .select({ id: ParentStudentLinkTable.id })
    .from(ParentStudentLinkTable)
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
        eq(ParentStudentLinkTable.student_id, studentId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { ok: true, link_id: existing[0]!.id };
  }

  const [link] = await db
    .insert(ParentStudentLinkTable)
    .values({
      parent_id: parentProfile[0]!.id,
      student_id: studentId,
      relationship: relationship ?? null,
      is_primary: isPrimary ?? false,
    })
    .returning({ id: ParentStudentLinkTable.id });

  if (!link) {
    throw new Error("Failed to link student to parent");
  }

  return { ok: true, link_id: link.id };
}

export async function unlinkStudent(
  parentUserId: string,
  studentId: string,
): Promise<{ ok: boolean }> {
  const parentProfile = await db
    .select({ id: ParentProfileTable.id })
    .from(ParentProfileTable)
    .where(eq(ParentProfileTable.user_id, parentUserId))
    .limit(1);

  if (parentProfile.length === 0) {
    return { ok: true };
  }

  await db
    .update(ParentStudentLinkTable)
    .set({ revoked_at: new Date() })
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
        eq(ParentStudentLinkTable.student_id, studentId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    );

  return { ok: true };
}
