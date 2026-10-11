"use server";

import { requireRole } from "@/_platform/auth/guard";

import type { ListTeachersQuery } from "../_domain/types";
import { listTeachers as list } from "./service";

export async function listTeachers(query: ListTeachersQuery = {}) {
  await requireRole("administrator");
  return await list(query);
}
