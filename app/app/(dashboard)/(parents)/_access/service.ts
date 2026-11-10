import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ParentProfileTable, ParentStudentLinkTable } from "@/_platform/db/schema";

export async function getParentProfileId(parentUserId: string): Promise<string | null> {
  const parentProfile = await db
    .select({ id: ParentProfileTable.id })
    .from(ParentProfileTable)
    .where(eq(ParentProfileTable.user_id, parentUserId))
    .limit(1);

  return parentProfile[0]?.id ?? null;
}

export async function isParentLinkedToStudent(
  parentUserId: string,
  studentId: string,
): Promise<boolean> {
  const parentProfileId = await getParentProfileId(parentUserId);
  if (!parentProfileId) {
    return false;
  }

  const link = await db
    .select({ id: ParentStudentLinkTable.id })
    .from(ParentStudentLinkTable)
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        eq(ParentStudentLinkTable.student_id, studentId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    )
    .limit(1);

  return link.length > 0;
}

export async function getParentStudentIds(parentUserId: string): Promise<string[]> {
  const parentProfileId = await getParentProfileId(parentUserId);
  if (!parentProfileId) {
    return [];
  }

  const linkedStudents = await db
    .select({ student_id: ParentStudentLinkTable.student_id })
    .from(ParentStudentLinkTable)
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    );

  return linkedStudents.map((row) => row.student_id);
}
