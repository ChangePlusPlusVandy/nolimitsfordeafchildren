"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { resolveTeacherProfileId } from "../_resolve/service";
import { getTeacherLocations as locations } from "./service";

export async function getTeacherLocations(id: string) {
  await requireRole("administrator");
  const profileId = await resolveTeacherProfileId(id);
  if (!profileId) {
    throw new NotFoundError("Teacher not found");
  }
  return await locations(profileId);
}
