import { and, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type AssessmentEntity,
  AssessmentFocusTable,
  AssessmentTable,
} from "@/_platform/db/schema";
import { NotFoundError } from "@/_shared/server/errors";

import { create } from "../_create/service";
import type { CloneAssessmentInput, CreateAssessmentInput } from "../_domain/types";

export async function clone(
  assessmentId: string,
  teacherId: string,
  overrides: CloneAssessmentInput = {},
): Promise<AssessmentEntity> {
  const existing = await db
    .select()
    .from(AssessmentTable)
    .where(and(eq(AssessmentTable.id, assessmentId), eq(AssessmentTable.teacher_id, teacherId)))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError("Assessment not found or you don't have permission to clone it");
  }

  const source = existing[0]!;
  const sourceFocuses = await db
    .select()
    .from(AssessmentFocusTable)
    .where(eq(AssessmentFocusTable.assessment_id, source.id));
  const input: CreateAssessmentInput = {
    student_id: source.student_id,
    teacher_id: teacherId,
    cycle_start_date: overrides.cycle_start_date ?? source.cycle_start_date,
    assessment_type:
      overrides.assessment_type ?? (source.assessment_type === "pre" ? "post" : "pre"),
    teaching_focus: overrides.teaching_focus ?? source.teaching_focus,
    summary:
      overrides.summary === undefined
        ? (source.summary ?? undefined)
        : (overrides.summary ?? undefined),
    focuses:
      overrides.focuses ??
      sourceFocuses
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((focus) => ({ goal: focus.goal, score: focus.score, max_score: focus.max_score })),
    score: overrides.score ?? source.score,
    notes:
      overrides.notes === undefined ? (source.notes ?? undefined) : (overrides.notes ?? undefined),
  };

  return create(input);
}
