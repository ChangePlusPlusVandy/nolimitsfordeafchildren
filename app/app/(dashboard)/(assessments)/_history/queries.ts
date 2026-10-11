"use server";

import { assertCanAccessStudent } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";

import { AssessmentHistoryService } from "./service";

export async function listStudentAssessments(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole("administrator", "teacher", "parent");
  await assertCanAccessStudent(user, studentId);
  return await new AssessmentHistoryService().listForStudent(studentId, query);
}

export async function listAssessmentsForStudent(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  return await listStudentAssessments(studentId, query);
}
