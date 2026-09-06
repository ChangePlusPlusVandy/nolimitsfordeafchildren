"use server";
import { type ListSessionsQuery, SessionsService } from "@/server/sessions/service";
import { requireRole } from "@/server/shared/auth-guard";

/**
 * GET /v1/sessions — list teaching cycles (admin only).
 */
export async function listSessions(query: ListSessionsQuery = {}) {
  await requireRole("administrator");
  return await new SessionsService().index(query);
}

/**
 * GET /v1/sessions/current — current cycle (admin only). Wrapped in
 * `{ item }` to match the legacy controller.
 */
export async function getCurrentSession() {
  await requireRole("administrator");
  const session = await new SessionsService().getCurrentSession();
  return { item: session };
}
