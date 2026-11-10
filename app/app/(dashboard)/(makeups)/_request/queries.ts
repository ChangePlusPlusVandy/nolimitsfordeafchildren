"use server";

import { getMissedSessions } from "@/(dashboard)/(parents)/_domain/server";
import { requireRole } from "@/_platform/auth/guard";

export async function getMakeupableMissedSessions(studentId: string) {
  await requireRole("parent", "administrator");
  return await getMissedSessions(studentId);
}
