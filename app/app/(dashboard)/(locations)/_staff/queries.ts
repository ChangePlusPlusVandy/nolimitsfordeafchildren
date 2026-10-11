"use server";

import { requireRole } from "@/_platform/auth/guard";

import { staffByLocation as staff } from "./service";

export async function staffByLocation(siteId: string) {
  const currentUser = await requireRole("parent", "administrator");
  return await staff(siteId, currentUser);
}
