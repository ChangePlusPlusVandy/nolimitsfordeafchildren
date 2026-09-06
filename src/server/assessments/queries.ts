"use server";
import { AssessmentsService } from "@/server/assessments/service";
import { requireRole } from "@/server/shared/auth-guard";

/**
 * GET /v1/students/:studentId/assessments — grouped by cycle
 * (administrator | teacher | parent).
 */
export async function listStudentAssessments(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  await requireRole("administrator", "teacher", "parent");
  return await new AssessmentsService().listForStudent(studentId, query);
}

/**
 * Client-facing alias (src/client/assessments.ts imports this name).
 */
export async function listAssessmentsForStudent(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  return await listStudentAssessments(studentId, query);
}

/**
 * GET /v1/assessments/:id — administrator | teacher | parent.
 */
export async function getAssessment(id: string) {
  await requireRole("administrator", "teacher", "parent");
  const assessment = await new AssessmentsService().show(id);
  if (!assessment) {
    throw new Error("Assessment not found");
  }
  return assessment;
}
