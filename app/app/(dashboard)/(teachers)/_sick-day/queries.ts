"use server";

import { requireRole } from "@/_platform/auth/guard";

import { listSickDayNotices } from "./list";

export async function listTeacherSickDayNotices(query: { from?: string; to?: string } = {}) {
  await requireRole("administrator");
  return listSickDayNotices(query);
}
