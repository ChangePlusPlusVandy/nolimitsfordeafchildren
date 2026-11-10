"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";

import type { CreateTeacherInput } from "../_domain/types";
import { createTeacher as create } from "./service";

const createTeacherSchema = z
  .object({
    user_id: z.string().min(1),
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

export async function createTeacher(input: CreateTeacherInput) {
  await requireRole("administrator");
  const parsed = createTeacherSchema.parse(input) as CreateTeacherInput;
  return await create(parsed);
}
