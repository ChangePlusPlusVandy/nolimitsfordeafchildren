"use server";

import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError, NotFoundError } from "@/_shared/server/errors";

import { bulletinsService } from "../_domain/server";
import type { UpdateBulletinInput } from "../_domain/types";
import { updateBulletinSchema } from "./validation";

export async function updateBulletin(id: string, input: UpdateBulletinInput) {
  await requireRole("administrator");

  if (input.scope && !["global", "site"].includes(input.scope)) {
    throw new BadRequestError("Scope must be 'global' or 'site'");
  }
  if (
    input.role_target &&
    !["all", "administrator", "teacher", "parent"].includes(input.role_target)
  ) {
    throw new BadRequestError("role_target must be 'all', 'administrator', 'teacher', or 'parent'");
  }

  const parsed = updateBulletinSchema.parse(input) as UpdateBulletinInput;

  const bulletin = await bulletinsService.update(id, parsed);
  if (!bulletin) {
    throw new NotFoundError("Bulletin not found");
  }
  return bulletin;
}
