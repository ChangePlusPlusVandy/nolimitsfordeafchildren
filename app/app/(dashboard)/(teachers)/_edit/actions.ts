"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import type { UpdateTeacherInput } from "../_domain/types";
import { requireTeacherProfileId } from "../_resolve/service";
import { updateTeacher as update } from "./service";

const updateTeacherSchema = z
  .object({
    primary_site_id: z.string().nullable().optional(),
    bio: z.string().max(2000).nullable().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    qualifications: z.string().max(2000).nullable().optional(),
    credentials: z.string().max(2000).nullable().optional(),
    age_group_specialty: z
      .enum([
        "infant",
        "toddler",
        "preschool",
        "elementary",
        "middle_school",
        "high_school",
        "young_adult",
        "all_ages",
      ])
      .optional(),
  })
  .passthrough();

export async function updateTeacher(id: string, input: UpdateTeacherInput) {
  await requireRole("administrator");
  const parsed = updateTeacherSchema.parse(input) as UpdateTeacherInput;
  const profileId = await requireTeacherProfileId(id);
  const teacher = await update(profileId, parsed);
  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }
  return teacher;
}
