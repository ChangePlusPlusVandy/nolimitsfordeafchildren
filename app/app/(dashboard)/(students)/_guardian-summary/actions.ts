"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { updateGuardianSummary as updateSummary } from "./service";
import { guardianSummarySchema } from "./validation";

export async function updateGuardianSummary(
  id: string,
  input: { guardian_summary?: string | null },
) {
  const user = await requireRole("administrator", "teacher");
  const parsed = guardianSummarySchema.parse(input);

  const normalizedSummary =
    parsed.guardian_summary === undefined
      ? null
      : parsed.guardian_summary?.trim()
        ? parsed.guardian_summary.trim()
        : null;

  const student = await updateSummary(id, normalizedSummary, { id: user.id, role: user.role });

  if (!student) {
    throw new NotFoundError("Student not found");
  }

  return student;
}
