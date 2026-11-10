"use server";

import { assertTeacherAssignedToStudent } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";

import type { CreateAssessmentInput } from "../_domain/types";
import { requireTeacherProfileId } from "../_teacher/access";
import { create } from "./service";
import { createAssessmentSchema } from "./validation";

export async function createAssessment(
  studentId: string,
  input: Omit<CreateAssessmentInput, "student_id" | "teacher_id">,
) {
  const currentUser = await requireRole("teacher");
  const parsed = createAssessmentSchema.parse(input) as Omit<
    CreateAssessmentInput,
    "student_id" | "teacher_id"
  >;

  const teacherId = await requireTeacherProfileId(currentUser.id, "create");
  await assertTeacherAssignedToStudent(currentUser.id, studentId);

  return await create({ student_id: studentId, teacher_id: teacherId, ...parsed });
}
