"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import type { UpdateUserInput } from "../_domain/types";
import { updateUser as update } from "./service";
import { updateUserSchema } from "./validation";

export async function updateUser(id: string, input: UpdateUserInput) {
  await requireRole("administrator");
  const parsed = updateUserSchema.parse(input) as UpdateUserInput;

  const user = await update(id, parsed);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}
