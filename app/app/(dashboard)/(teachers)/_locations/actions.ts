"use server";

import { requireRole } from "@/_platform/auth/guard";

import { requireTeacherProfileId } from "../_resolve/service";
import { assignTeacherToLocation, unassignTeacherFromLocation } from "./service";

export async function assignTeacherLocation(id: string, locationId: string) {
  await requireRole("administrator");
  const profileId = await requireTeacherProfileId(id);
  await assignTeacherToLocation(profileId, locationId);
  return { success: true };
}

export async function unassignTeacherLocation(id: string, locationId: string) {
  await requireRole("administrator");
  const profileId = await requireTeacherProfileId(id);
  await unassignTeacherFromLocation(profileId, locationId);
  return { success: true };
}
