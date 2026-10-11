import { and, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type AssessmentEntity,
  type AssessmentFocusInsert,
  AssessmentFocusTable,
  AssessmentTable,
} from "@/_platform/db/schema";
import { BadRequestError } from "@/_shared/server/errors";

import type { CreateAssessmentInput } from "../_domain/types";
import { summarizeFocuses, validateFocuses } from "../_form/scoring";

export async function update(
  id: string,
  teacherId: string,
  data: Partial<
    Pick<CreateAssessmentInput, "teaching_focus" | "summary" | "focuses" | "score" | "notes">
  >,
): Promise<AssessmentEntity | null> {
  const existing = await db
    .select()
    .from(AssessmentTable)
    .where(and(eq(AssessmentTable.id, id), eq(AssessmentTable.teacher_id, teacherId)))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const normalizedFocuses = data.focuses === undefined ? undefined : validateFocuses(data.focuses);
  let normalizedTeachingFocus = data.teaching_focus;
  let normalizedScore = data.score;

  if (normalizedFocuses && normalizedFocuses.length > 0) {
    const legacySummary = summarizeFocuses(normalizedFocuses);
    normalizedTeachingFocus = legacySummary.teaching_focus;
    normalizedScore = legacySummary.score;
  }

  if (normalizedScore !== undefined && (normalizedScore < 0 || normalizedScore > 20)) {
    throw new BadRequestError("Score must be between 0 and 20");
  }

  const { focuses: _focuses, ...assessmentUpdateData } = data;
  const result = await db
    .update(AssessmentTable)
    .set({
      ...assessmentUpdateData,
      ...(normalizedTeachingFocus !== undefined ? { teaching_focus: normalizedTeachingFocus } : {}),
      ...(normalizedScore !== undefined ? { score: normalizedScore } : {}),
      updated_at: new Date(),
    })
    .where(eq(AssessmentTable.id, id))
    .returning();

  if (normalizedFocuses !== undefined) {
    await db.delete(AssessmentFocusTable).where(eq(AssessmentFocusTable.assessment_id, id));

    if (normalizedFocuses.length > 0) {
      const focusRows: AssessmentFocusInsert[] = normalizedFocuses.map((focus, index) => ({
        assessment_id: id,
        goal: focus.goal.trim(),
        score: focus.score,
        max_score: focus.max_score,
        sort_order: index,
      }));

      await db.insert(AssessmentFocusTable).values(focusRows);
    }
  }

  return result[0] ?? null;
}
