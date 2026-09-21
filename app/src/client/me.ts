/**
 * Thin client data-access layer for the current user ("me") profile.
 *
 * Names reconcile 1:1 with `src/server/me/{queries,actions}.ts`.
 */

import { updateMe as serverUpdateMe } from "@/server/me/actions";
import { getMe as getMeQuery } from "@/server/me/queries";

export type { UpdateMeInput, UserProfileWithIds } from "@/server/me/service";

export interface MeProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  locale: string;
  role: "administrator" | "teacher" | "parent" | "unassigned";
  is_active: boolean;
  created_at: string;
  teacherProfileId?: string | null;
  parentProfileId?: string | null;
  parentAddress?: {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
}

/** Current user's app profile (role + contact info + profile ids). */
export async function getMe(): Promise<MeProfile> {
  return getMeQuery() as never;
}

/** Update the current user's own profile. */
export async function updateMe(input: import("@/server/me/service").UpdateMeInput) {
  return serverUpdateMe(input);
}
