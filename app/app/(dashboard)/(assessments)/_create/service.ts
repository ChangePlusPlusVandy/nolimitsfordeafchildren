import { and, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type AssessmentEntity,
  type AssessmentFocusInsert,
  AssessmentFocusTable,
  type AssessmentInsert,
  AssessmentTable,
  StudentTable,
  TeacherProfileTable,
} from "@/_platform/db/schema";
import { BadRequestError, ConflictError, NotFoundError } from "@/_shared/server/errors";

import type { CreateAssessmentInput } from "../_domain/types";
import { summarizeFocuses, validateFocuses } from "../_form/scoring";

export async function create(input: CreateAssessmentInput): Promise<AssessmentEntity> {
  const normalizedFocuses = validateFocuses(input.focuses);
  const hasFocuses = normalizedFocuses.length > 0;
  const normalizedTeachingFocus = hasFocuses
    ? summarizeFocuses(normalizedFocuses).teaching_focus
    : input.teaching_focus;
  const normalizedScore = hasFocuses ? summarizeFocuses(normalizedFocuses).score : input.score;

  if (normalizedScore < 0 || normalizedScore > 20) {
    throw new BadRequestError("Score must be between 0 and 20");
  }

  const student = await db
    .select()
    .from(StudentTable)
    .where(eq(StudentTable.id, input.student_id))
    .limit(1);

  if (student.length === 0) {
    throw new NotFoundError("Student not found");
  }

  const teacher = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.id, input.teacher_id))
    .limit(1);

  if (teacher.length === 0) {
    throw new NotFoundError("Teacher not found");
  }

  const existing = await db
    .select()
    .from(AssessmentTable)
    .where(
      and(
        eq(AssessmentTable.student_id, input.student_id),
        eq(AssessmentTable.cycle_start_date, input.cycle_start_date),
        eq(AssessmentTable.assessment_type, input.assessment_type),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError(`A ${input.assessment_type} assessment already exists for this cycle`);
  }

  const newAssessment: AssessmentInsert = {
    student_id: input.student_id,
    teacher_id: input.teacher_id,
    cycle_start_date: input.cycle_start_date,
    assessment_type: input.assessment_type,
    teaching_focus: normalizedTeachingFocus,
    summary: input.summary || null,
    score: normalizedScore,
    notes: input.notes || null,
    assessed_at: new Date(),
  };
  const result = await db.insert(AssessmentTable).values(newAssessment).returning();

  if (hasFocuses && result[0]) {
    const focusRows: AssessmentFocusInsert[] = normalizedFocuses.map((focus, index) => ({
      assessment_id: result[0]!.id,
      goal: focus.goal.trim(),
      score: focus.score,
      max_score: focus.max_score,
      sort_order: index,
    }));

    await db.insert(AssessmentFocusTable).values(focusRows);
  }

  return result[0]!;
}
