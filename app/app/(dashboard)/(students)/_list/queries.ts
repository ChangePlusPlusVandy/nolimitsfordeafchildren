"use server";

import { requireRole } from "@/_platform/auth/guard";

import type { StudentFilters } from "../_domain/types";
import { index } from "./service";

export async function listStudents(query: StudentFilters = {}) {
  const user = await requireRole();
  return await index(query, user.role, user.id);
}
