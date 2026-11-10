"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import type { UpdateStudentInput } from "../_domain/types";
import { UpdateStudentService } from "./service";
import { updateStudentSchema } from "./validation";

export async function updateStudent(id: string, input: UpdateStudentInput) {
  await requireRole("administrator");
  const parsed = updateStudentSchema.parse(input) as UpdateStudentInput;
  const student = await new UpdateStudentService().update(id, parsed);
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}
