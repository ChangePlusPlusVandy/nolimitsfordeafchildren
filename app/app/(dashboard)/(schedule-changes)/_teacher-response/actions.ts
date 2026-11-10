"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { teacherRespond as respond } from "./service";
import { teacherResponseSchema } from "./validation";

export async function teacherRespond(
  id: string,
  input: { response_status: "available" | "unavailable" | "conditional"; notes?: string },
) {
  const currentUser = await requireRole("teacher");
  const parsed = teacherResponseSchema.parse(input);

  const updated = await respond(id, currentUser.id, parsed);
  if (!updated) {
    throw new NotFoundError("Schedule change request not found");
  }
  return updated;
}
