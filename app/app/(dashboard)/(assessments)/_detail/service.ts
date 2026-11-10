import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  AssessmentFocusTable,
  AssessmentTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
} from "@/_platform/db/schema";

import type { AssessmentWithDetails } from "../_domain/types";

export async function show(id: string): Promise<AssessmentWithDetails | null> {
  const results = await db
    .select({
      id: AssessmentTable.id,
      student_id: AssessmentTable.student_id,
      teacher_id: AssessmentTable.teacher_id,
      cycle_start_date: AssessmentTable.cycle_start_date,
      assessment_type: AssessmentTable.assessment_type,
      teaching_focus: AssessmentTable.teaching_focus,
      summary: AssessmentTable.summary,
      score: AssessmentTable.score,
      notes: AssessmentTable.notes,
      assessed_at: AssessmentTable.assessed_at,
      created_at: AssessmentTable.created_at,
      updated_at: AssessmentTable.updated_at,
      teacher_name: UserTable.name,
      student_initials: StudentTable.initials,
      student_first_name: StudentTable.first_name,
      student_last_name: StudentTable.last_name,
    })
    .from(AssessmentTable)
    .innerJoin(TeacherProfileTable, eq(AssessmentTable.teacher_id, TeacherProfileTable.id))
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .innerJoin(StudentTable, eq(AssessmentTable.student_id, StudentTable.id))
    .where(eq(AssessmentTable.id, id))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const row = results[0]!;
  const focusRows = await db
    .select()
    .from(AssessmentFocusTable)
    .where(eq(AssessmentFocusTable.assessment_id, row.id));

  return {
    id: row.id,
    student_id: row.student_id,
    teacher_id: row.teacher_id,
    cycle_start_date: row.cycle_start_date,
    assessment_type: row.assessment_type,
    teaching_focus: row.teaching_focus,
    summary: row.summary,
    score: row.score,
    notes: row.notes,
    assessed_at: row.assessed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    focuses: focusRows.sort((a, b) => a.sort_order - b.sort_order),
    teacher: { id: row.teacher_id, name: row.teacher_name },
    student: {
      id: row.student_id,
      initials: row.student_initials,
      first_name: row.student_first_name,
      last_name: row.student_last_name,
    },
  };
}
