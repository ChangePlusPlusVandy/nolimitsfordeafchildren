"use server";

import { z } from "zod";
import { EnrollmentsService } from "@/server/enrollments/service";
import { requireRole } from "@/server/shared/auth-guard";

const enrollmentSchema = z.record(z.string(), z.unknown());

/**
 * POST /v1/enrollments — create an enrollment (admin only).
 */
export async function createEnrollment(body: Record<string, unknown>) {
  await requireRole("administrator");
  const parsed = enrollmentSchema.parse(body);
  return await new EnrollmentsService().create(parsed);
}

/**
 * PATCH /v1/enrollments/:id — update an enrollment (admin only).
 */
export async function updateEnrollment(id: string, body: Record<string, unknown>) {
  await requireRole("administrator");
  const parsed = enrollmentSchema.parse(body);
  return await new EnrollmentsService().update(id, parsed);
}
