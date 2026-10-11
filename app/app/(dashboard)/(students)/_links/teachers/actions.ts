"use server";

import { requireRole } from "@/_platform/auth/guard";

import { linkTeacher, unlinkTeacher } from "./service";

export async function linkStudentTeacher(id: string, teacherId: string) {
  await requireRole("administrator");
  return await linkTeacher(id, teacherId);
}

export async function unlinkStudentTeacher(id: string, teacherId: string) {
  await requireRole("administrator");
  return await unlinkTeacher(id, teacherId);
}
