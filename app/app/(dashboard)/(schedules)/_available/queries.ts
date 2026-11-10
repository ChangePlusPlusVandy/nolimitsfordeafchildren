"use server";

import { requireRole } from "@/_platform/auth/guard";

import type { AvailableSchedulesQuery } from "../_domain/types";
import { getAvailable } from "./service";

export async function availableSchedules(query: AvailableSchedulesQuery = {}) {
  await requireRole("parent", "administrator");
  return await getAvailable(query);
}

export async function getAvailableSchedules(query: AvailableSchedulesQuery = {}) {
  return await availableSchedules(query);
}
