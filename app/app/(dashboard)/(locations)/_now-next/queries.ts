"use server";

import { requireRole } from "@/_platform/auth/guard";

import { nowNext as sessions } from "./service";

export async function nowNext(siteId: string, query?: { date?: string }) {
  await requireRole("administrator", "teacher");
  return await sessions(siteId, query);
}

export async function getSiteNowNext(siteId: string, query?: { date?: string }) {
  await requireRole("administrator", "teacher");
  return await sessions(siteId, query);
}
