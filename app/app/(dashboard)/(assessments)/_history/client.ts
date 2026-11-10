import type { PaginatedAssessmentsResponse } from "../_domain/types";
import { listStudentAssessments as serverListStudentAssessments } from "./queries";

export async function listAssessmentsForStudent(
  studentId: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedAssessmentsResponse> {
  return serverListStudentAssessments(studentId, params) as never;
}
