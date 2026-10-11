import type { UserProfileWithIds } from "../_domain/types";

export function profileResponse(profile: UserProfileWithIds) {
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
