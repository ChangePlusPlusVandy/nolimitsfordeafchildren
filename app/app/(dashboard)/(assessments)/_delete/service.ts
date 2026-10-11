import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/_platform/db";
import { AssessmentFocusTable, AssessmentTable } from "@/_platform/db/schema";

export async function deleteAssessment(id: string, teacherId?: string): Promise<boolean> {
  const conditions = [eq(AssessmentTable.id, id)];

  if (teacherId) {
    conditions.push(eq(AssessmentTable.teacher_id, teacherId));
  }

  const existing = await db
    .select({ id: AssessmentTable.id })
    .from(AssessmentTable)
    .where(and(...conditions));

  if (existing.length === 0) {
    return false;
  }

  const assessmentIds = existing.map((row) => row.id);
  await db
    .delete(AssessmentFocusTable)
    .where(inArray(AssessmentFocusTable.assessment_id, assessmentIds));
  const result = await db
    .delete(AssessmentTable)
    .where(and(...conditions))
    .returning();

  return result.length > 0;
}
