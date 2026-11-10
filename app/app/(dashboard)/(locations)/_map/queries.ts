"use server";

import { requireRole } from "@/_platform/auth/guard";

import { mapSummary as summary } from "./service";

export async function mapSummary() {
  await requireRole("administrator", "teacher");
  return await summary();
}

export async function getLocationMap() {
  return await mapSummary();
}
