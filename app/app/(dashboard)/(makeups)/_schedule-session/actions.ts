"use server";

import { requireRole } from "@/_platform/auth/guard";

import { createSession } from "./service";
import type { CreateMakeupSessionInput } from "./types";
import { createSessionSchema } from "./validation";

export async function createMakeupSession(input: Omit<CreateMakeupSessionInput, "created_by">) {
  const currentUser = await requireRole("administrator");
  const parsed = createSessionSchema.parse(input) as Omit<CreateMakeupSessionInput, "created_by">;

  return await createSession({ ...parsed, created_by: currentUser.id });
}
