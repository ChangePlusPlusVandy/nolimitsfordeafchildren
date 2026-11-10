"use server";

import { requireRole } from "@/_platform/auth/guard";

import { getCurrentSession as currentSession } from "./service";

export async function getCurrentSession() {
  await requireRole("administrator");
  const session = await currentSession();
  return { item: session };
}
