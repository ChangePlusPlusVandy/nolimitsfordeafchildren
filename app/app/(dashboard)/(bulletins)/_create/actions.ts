"use server";

import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError } from "@/_shared/server/errors";

import { bulletinsService } from "../_domain/server";
import type { CreateBulletinInput } from "../_domain/types";
import { createBulletinSchema } from "./validation";

export async function createBulletin(input: CreateBulletinInput) {
  const currentUser = await requireRole("administrator", "teacher");

  if (!input.title || !input.title.trim()) {
    throw new BadRequestError("Title is required");
  }
  if (!input.scope || !["global", "site"].includes(input.scope)) {
    throw new BadRequestError("Scope must be 'global' or 'site'");
  }
  if (input.scope === "site" && !input.site_id) {
    throw new BadRequestError("site_id is required when scope is 'site'");
  }
  if (
    !input.role_target ||
    !["all", "administrator", "teacher", "parent"].includes(input.role_target)
  ) {
    throw new BadRequestError("role_target must be 'all', 'administrator', 'teacher', or 'parent'");
  }

  const parsed = createBulletinSchema.parse(input) as CreateBulletinInput;

  return await bulletinsService.create(parsed, currentUser.id, currentUser.role);
}
