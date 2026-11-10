"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import type { UpdateMeInput } from "../_domain/types";
import { updateProfile } from "./service";
import { updateMeSchema } from "./validation";

export async function updateMe(input: UpdateMeInput) {
  // Unlike the self-profile query, edits retain the unassigned-user gate.
  const currentUser = await requireRole();
  const parsed = updateMeSchema.parse(input) as UpdateMeInput;

  const updated = await updateProfile(currentUser.id, parsed);
  if (!updated) {
    throw new NotFoundError("User not found");
  }

  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    phone: updated.phone,
    photo_url: updated.photo_url,
    locale: updated.locale,
    role: updated.role,
    is_active: updated.is_active,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  };
}
