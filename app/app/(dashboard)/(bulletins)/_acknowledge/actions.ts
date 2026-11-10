"use server";

import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError } from "@/_shared/server/errors";

import { bulletinsService } from "../_domain/server";
import type { AcknowledgeBulletinInput } from "../_domain/types";
import { acknowledgeSchema } from "./validation";

export async function acknowledgeBulletin(id: string, input: AcknowledgeBulletinInput) {
  const currentUser = await requireRole("parent");

  if (!input.initials || !input.initials.trim()) {
    throw new BadRequestError("initials are required");
  }

  const parsed = acknowledgeSchema.parse(input);

  return await bulletinsService.acknowledgeBulletin(id, currentUser.id, parsed);
}
