"use server";

import { assertTeacherAssignedToStudent } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { show } from "../_detail/service";
import { requireTeacherProfileId } from "../_teacher/access";
import { clone } from "./service";
import { cloneAssessmentSchema } from "./validation";

export async function cloneAssessment(
  id: string,
  input: {
    cycle_start_date?: string;
    assessment_type?: "pre" | "post";
    teaching_focus?: string;
    summary?: string | null;
    focuses?: Array<{ goal: string; score: number; max_score: number }>;
    score?: number;
    notes?: string | null;
  },
) {
  const currentUser = await requireRole("teacher");
  const parsed = cloneAssessmentSchema.parse(input) as {
    cycle_start_date?: string;
    assessment_type?: "pre" | "post";
    teaching_focus?: string;
    summary?: string | null;
    focuses?: Array<{ goal: string; score: number; max_score: number }>;
    score?: number;
    notes?: string | null;
  };

  const teacherId = await requireTeacherProfileId(currentUser.id, "clone");
  const source = await show(id);
  if (!source) {
    throw new NotFoundError("Assessment not found");
  }
  await assertTeacherAssignedToStudent(currentUser.id, source.student_id);

  return await clone(id, teacherId, parsed);
}
