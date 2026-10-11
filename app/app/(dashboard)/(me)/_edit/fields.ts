import type { ParentProfileInsert, UserInsert } from "@/_platform/db/schema";

import type { UpdateMeInput } from "../_domain/types";

export function profileFields(input: UpdateMeInput): Partial<UserInsert> {
  // Ignore passthrough fields such as email, role, and is_active on self-edits.
  const updateData: Partial<UserInsert> = { updated_at: new Date() };

  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.phone !== undefined) {
    updateData.phone = input.phone;
  }
  if (input.photo_url !== undefined) {
    updateData.photo_url = input.photo_url;
  }
  if (input.locale !== undefined) {
    updateData.locale = input.locale;
  }

  return updateData;
}

export function addressFields(input: UpdateMeInput): Partial<ParentProfileInsert> {
  return {
    ...(input.address_line1 !== undefined ? { address_line1: input.address_line1 || null } : {}),
    ...(input.address_line2 !== undefined ? { address_line2: input.address_line2 || null } : {}),
    ...(input.city !== undefined ? { city: input.city || null } : {}),
    ...(input.state !== undefined ? { state: input.state || null } : {}),
    ...(input.postal_code !== undefined ? { postal_code: input.postal_code || null } : {}),
    updated_at: new Date(),
  };
}
