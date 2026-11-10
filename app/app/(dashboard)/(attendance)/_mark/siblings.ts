import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/_platform/db";
import { AttendanceSiblingParticipantTable, SiblingTable } from "@/_platform/db/schema";

export { normalizeSiblingParticipantIds } from "./siblingIds";

export async function replaceSiblingParticipants(
  attendanceId: string,
  studentId: string,
  siblingIds: string[],
): Promise<void> {
  await db
    .delete(AttendanceSiblingParticipantTable)
    .where(eq(AttendanceSiblingParticipantTable.attendance_id, attendanceId));

  if (siblingIds.length === 0) {
    return;
  }

  const validSiblings = await db
    .select({ id: SiblingTable.id })
    .from(SiblingTable)
    .where(and(eq(SiblingTable.student_id, studentId), inArray(SiblingTable.id, siblingIds)));

  const validSiblingIds = validSiblings.map((s) => s.id);
  if (validSiblingIds.length === 0) {
    return;
  }

  await db.insert(AttendanceSiblingParticipantTable).values(
    validSiblingIds.map((siblingId) => ({
      attendance_id: attendanceId,
      sibling_id: siblingId,
    })),
  );
}
