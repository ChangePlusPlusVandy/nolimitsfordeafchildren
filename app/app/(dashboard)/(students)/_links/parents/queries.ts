"use server";

import { requireRole } from "@/_platform/auth/guard";

import { assertCanAccessStudent } from "../../_domain/access";
import { parents } from "./service";

export async function getStudentParents(id: string, query: { page?: number; limit?: number } = {}) {
  const user = await requireRole();
  await assertCanAccessStudent(user, id);
  return await parents(id, query);
}
