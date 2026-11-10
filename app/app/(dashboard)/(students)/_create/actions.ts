"use server";

import { requireRole } from "@/_platform/auth/guard";

import type { CreateStudentInput } from "../_domain/types";
import { CreateStudentService } from "./service";
import { createStudentSchema } from "./validation";

export async function createStudent(input: CreateStudentInput) {
  await requireRole("administrator");
  const parsed = createStudentSchema.parse(input) as CreateStudentInput;
  return await new CreateStudentService().create(parsed);
}
