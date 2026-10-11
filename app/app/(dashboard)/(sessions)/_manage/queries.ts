"use server";
import { requireRole } from "@/_platform/auth/guard";

import type { ListSessionsQuery } from "../_domain/types";
import { sessionManagement } from "./service";

/**
 * GET /v1/sessions — list teaching cycles (admin only).
 */
export async function listSessions(query: ListSessionsQuery = {}) {
  await requireRole("administrator");
  return await sessionManagement.index(query);
}
