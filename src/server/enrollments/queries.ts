"use server";
import { EnrollmentsService } from "@/server/enrollments/service";
import { requireRole } from "@/server/shared/auth-guard";

/**
 * GET /v1/enrollments — any authenticated user.
 */
export async function listEnrollments(
  query: {
    student_id?: string;
    schedule_id?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  } = {},
) {
  await requireRole();
  return await new EnrollmentsService().index(query);
}
