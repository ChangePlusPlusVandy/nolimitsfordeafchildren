"use server";

import { assertCanAccessStudent } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { show } from "./service";

export async function getAssessment(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const assessment = await show(id);
  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }
  await assertCanAccessStudent(user, assessment.student_id);
  return assessment;
}
