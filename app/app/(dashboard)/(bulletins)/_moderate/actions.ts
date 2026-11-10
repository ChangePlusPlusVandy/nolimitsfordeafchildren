"use server";

import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError, NotFoundError } from "@/_shared/server/errors";

import { bulletinsService } from "../_domain/server";
import type { ReviewBulletinInput } from "../_domain/types";
import { reviewBulletinSchema } from "./validation";

export async function reviewBulletin(id: string, input: ReviewBulletinInput) {
  const currentUser = await requireRole("administrator");

  if (!input.status || !["approved", "rejected"].includes(input.status)) {
    throw new BadRequestError("status must be 'approved' or 'rejected'");
  }

  const parsed = reviewBulletinSchema.parse(input) as ReviewBulletinInput;

  const bulletin = await bulletinsService.reviewBulletin(id, currentUser.id, parsed);
  if (!bulletin) {
    throw new NotFoundError("Bulletin not found");
  }
  return bulletin;
}
