"use server";

import { assertCanViewTeacherProfile } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { getTeacher as show } from "./service";

export async function getTeacher(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const teacher = await show(id);
  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }
  await assertCanViewTeacherProfile(user, teacher.id);
  return teacher;
}
