"use server";

import { requireRole } from "@/_platform/auth/guard";

import type { ListSchedulesQuery } from "../_domain/types";
import { listSchedules as list } from "./service";

export async function listSchedules(query: ListSchedulesQuery = {}) {
  await requireRole();
  return await list(query);
}
