"use server";

import { requireRole } from "@/_platform/auth/guard";

import { createRequest } from "./service";
import type { CreateScheduleChangeInput } from "./types";
import { createRequestSchema } from "./validation";

export async function createScheduleChangeRequest(
  input: Omit<CreateScheduleChangeInput, "requested_by">,
) {
  const currentUser = await requireRole("parent", "administrator");
  const parsed = createRequestSchema.parse(input) as Omit<
    CreateScheduleChangeInput,
    "requested_by"
  >;

  return await createRequest({ ...parsed, requested_by: currentUser.id });
}
