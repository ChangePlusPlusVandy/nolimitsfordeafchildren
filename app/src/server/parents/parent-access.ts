import { and, eq, isNull } from "drizzle-orm";

import { ParentProfileTable, ParentStudentLinkTable } from "@/db/schema";
import { db } from "@/lib/db";

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
