"use server";

import { requireRole } from "@/_platform/auth/guard";

import { zipReport as readReport } from "./service";

export async function zipReport(query: { page?: number; limit?: number } = {}) {
  await requireRole("administrator");
  return await readReport(query);
}

export async function getZipReport(query: { page?: number; limit?: number } = {}) {
  return await zipReport(query);
}
