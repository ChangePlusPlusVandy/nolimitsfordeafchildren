"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { getLocation as show } from "./service";

export async function showLocation(siteId: string) {
  await requireRole("administrator", "teacher");
  const location = await show(siteId);
  if (!location) {
    throw new NotFoundError("Location not found");
  }
  return location;
}

export async function getLocation(siteId: string) {
  return await showLocation(siteId);
}
