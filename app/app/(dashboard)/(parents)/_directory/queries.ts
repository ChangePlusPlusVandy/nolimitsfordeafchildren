"use server";

import { requireRole } from "@/_platform/auth/guard";

import { directory as readDirectory } from "./service";

export async function directory(query: { page?: number; limit?: number } = {}) {
  const user = await requireRole("parent");
  return await readDirectory(user.id, query);
}

export async function getDirectory(query: { page?: number; limit?: number } = {}) {
  return await directory(query);
}
