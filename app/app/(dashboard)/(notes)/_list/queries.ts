"use server";

import { assertCanAccessStudent } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";

import { listForStudent } from "./service";

export async function listStudentNotes(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole("administrator", "teacher", "parent");
  await assertCanAccessStudent(user, studentId);
  return await listForStudent(studentId, query);
}

export async function listNotesForStudent(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  return await listStudentNotes(studentId, query);
}
