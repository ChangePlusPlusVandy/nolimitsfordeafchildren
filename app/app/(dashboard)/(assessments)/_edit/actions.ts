"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import type { CreateAssessmentInput } from "../_domain/types";
import { requireTeacherProfileId } from "../_teacher/access";
import { update } from "./service";
import { updateAssessmentSchema } from "./validation";

export async function updateAssessment(
  id: string,
  input: {
    teaching_focus?: string;
    focuses?: Array<{ goal: string; score: number; max_score: number }>;
    summary?: string;
    score?: number;
    notes?: string;
  },
) {
  const currentUser = await requireRole("teacher");
  const parsed = updateAssessmentSchema.parse(input) as Partial<
    Pick<CreateAssessmentInput, "teaching_focus" | "summary" | "focuses" | "score" | "notes">
  >;

  const teacherId = await requireTeacherProfileId(currentUser.id, "update");

  const assessment = await update(id, teacherId, parsed);
  if (!assessment) {
    throw new NotFoundError("Assessment not found or you don't have permission to update it");
  }
  return assessment;
}
