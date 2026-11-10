"use server";

import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError } from "@/_shared/server/errors";

import { type InviteUserInput, USER_ROLES } from "../_domain/types";
import { inviteUser as invite } from "./service";
import { inviteUserSchema } from "./validation";

export async function inviteUser(input: InviteUserInput) {
  await requireRole("administrator");

  if (!input.email || !input.name || !input.role) {
    throw new BadRequestError("email, name, and role are required");
  }
  if (!USER_ROLES.includes(input.role)) {
    throw new BadRequestError("role must be administrator, teacher, parent, or unassigned");
  }

  const parsed = inviteUserSchema.parse(input) as InviteUserInput;
  return await invite(parsed);
}
