"use server";

import { requireRole } from "@/_platform/auth/guard";

import { getSiblingParticipationReport } from "./service";

export async function siblingParticipationReport(
  query: { date_from?: string; date_to?: string; site_id?: string } = {},
) {
  await requireRole("administrator");
  return await getSiblingParticipationReport(query);
}
