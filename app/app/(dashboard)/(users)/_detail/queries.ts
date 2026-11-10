"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { getUserWithStudents } from "./service";

export async function getUser(id: string) {
  await requireRole("administrator");
  const user = await getUserWithStudents(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}
