"use server";

import { requireRole } from "@/_platform/auth/guard";

import { createRequest } from "./service";
import type { CreateMakeupRequestInput } from "./types";
import { createRequestSchema } from "./validation";

export async function createMakeupRequest(input: Omit<CreateMakeupRequestInput, "requested_by">) {
  const currentUser = await requireRole("parent", "administrator");
  const parsed = createRequestSchema.parse(input) as Omit<CreateMakeupRequestInput, "requested_by">;

  return await createRequest({ ...parsed, requested_by: currentUser.id });
}
