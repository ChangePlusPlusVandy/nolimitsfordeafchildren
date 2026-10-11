"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { StudentDetailsService } from "./service";

export async function getStudent(id: string) {
  const user = await requireRole();
  const student = await new StudentDetailsService().show(id, { id: user.id, role: user.role });
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}
