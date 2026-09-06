"use server";
import { MeService } from "@/server/me/service";
import { getCurrentUser } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

/**
 * GET /v1/me — current user's profile. Like GET /v1/auth/me this is exempt
 * from the unassigned gate (Express authorizationChecker exception), so it
 * uses `getCurrentUser` (no role gate) rather than `requireRole`.
 */
export async function getMe() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new NotFoundError("User not found");
  }

  const profile = await new MeService().getProfile(currentUser.id);
  if (!profile) {
    throw new NotFoundError("User not found");
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    phone: profile.phone,
    photo_url: profile.photo_url,
    locale: profile.locale,
    role: profile.role,
    is_active: profile.is_active,
    created_at: profile.created_at,
    teacherProfileId: profile.teacherProfileId,
    parentProfileId: profile.parentProfileId,
    parentAddress: profile.parentAddress,
  };
}
