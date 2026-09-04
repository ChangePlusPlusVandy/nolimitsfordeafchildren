"use server";

import { z } from "zod";
import { MeService, type UpdateMeInput } from "@/server/me/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

const updateMeSchema = z
  .object({
    name: z.string().max(200).optional(),
    phone: z.string().max(50).nullable().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    locale: z.string().max(20).optional(),
    address_line1: z.string().max(200).nullable().optional(),
    address_line2: z.string().max(200).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    state: z.string().max(2).nullable().optional(),
    postal_code: z.string().max(20).nullable().optional(),
  })
  .passthrough();

/**
 * PATCH /v1/me — update the current user's own profile.
 * NOTE: the unassigned gate DOES apply here (the Express exemption was
 * GET-only for /auth/me and /me), hence requireRole() with no roles.
 */
export async function updateMe(input: UpdateMeInput) {
  const currentUser = await requireRole();

  const parsed = updateMeSchema.parse(input) as UpdateMeInput;

  const updated = await new MeService().updateProfile(currentUser.id, parsed);
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
