"use server";
import { assessmentsService } from "@/server/assessments/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";
import { assertCanAccessStudent } from "@/server/shared/student-access";

export async function listStudentAssessments(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole("administrator", "teacher", "parent");
  await assertCanAccessStudent(user, studentId);
  return await assessmentsService.listForStudent(studentId, query);
}

export async function listAssessmentsForStudent(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  return await listStudentAssessments(studentId, query);
}

export async function getAssessment(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const assessment = await assessmentsService.show(id);
  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }
  await assertCanAccessStudent(user, assessment.student_id);
  return assessment;
}
