"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { disableUser as disable, enableUser as enable } from "./service";

export async function disableUser(id: string) {
  await requireRole("administrator");
  const user = await disable(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return { success: true, message: "User disabled" };
}

export async function enableUser(id: string) {
  await requireRole("administrator");
  const user = await enable(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}
