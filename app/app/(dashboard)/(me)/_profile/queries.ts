"use server";

import { getCurrentUser } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { profileResponse } from "./response";
import { getProfile } from "./service";

export async function getMe() {
  // Self-profile reads allow unassigned users; edits still use requireRole.
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new NotFoundError("User not found");
  }

  const profile = await getProfile(currentUser.id);
  if (!profile) {
    throw new NotFoundError("User not found");
  }

  return profileResponse(profile);
}
