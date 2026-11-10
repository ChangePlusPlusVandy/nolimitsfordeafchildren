"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { reviewRequest } from "./service";
import { reviewRequestSchema } from "./validation";

export async function reviewScheduleChangeRequest(
  id: string,
  input: { status: "approved" | "denied" | "negotiating"; review_notes?: string },
) {
  const currentUser = await requireRole("administrator");
  const parsed = reviewRequestSchema.parse(input);

  const request = await reviewRequest(id, currentUser.id, parsed.status, parsed.review_notes);
  if (!request) {
    throw new NotFoundError("Schedule change request not found");
  }
  return request;
}
