"use server";

import { requireRole } from "@/_platform/auth/guard";

import { assertCanAccessStudent } from "../../_domain/access";
import { teachers, listLinkableTeachers as listLinkable } from "./service";

export async function getStudentTeachers(
  id: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole();
  await assertCanAccessStudent(user, id);
  return await teachers(id, query);
}

export async function listLinkableTeachers(
  query: { search?: string; page?: number; limit?: number } = {},
) {
  await requireRole("administrator");
  return await listLinkable(query);
}
