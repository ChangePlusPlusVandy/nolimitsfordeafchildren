"use server";

import { requireRole } from "@/_platform/auth/guard";

import type { ListLocationsQuery } from "../_domain/types";
import { listLocations as list } from "./service";

export async function listLocations(query: ListLocationsQuery = {}) {
  await requireRole("administrator", "teacher");
  return await list(query);
}
