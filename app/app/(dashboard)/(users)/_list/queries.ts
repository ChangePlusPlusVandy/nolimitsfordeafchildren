"use server";

import { requireRole } from "@/_platform/auth/guard";

import type { ListUsersQuery } from "../_domain/types";
import { listUsers as list } from "./service";

export async function listUsers(query: ListUsersQuery = {}) {
  await requireRole("administrator");
  return await list(query);
}
