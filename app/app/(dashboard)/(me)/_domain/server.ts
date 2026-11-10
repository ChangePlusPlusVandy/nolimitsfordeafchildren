import { updateProfile } from "../_edit/service";
import { getProfile } from "../_profile/service";
import type { UpdateMeInput } from "./types";

export { updateMe } from "../_edit/actions";
export type { UpdateMeInput, UserProfileWithIds } from "./types";

export class MeService {
  async getProfile(userId: string) {
    return getProfile(userId);
  }

  async updateProfile(userId: string, input: UpdateMeInput) {
    return updateProfile(userId, input);
  }

  // Legacy compatibility methods retain their original responses.
  async getMe() {
    return { id: "me", role: "administrator", allowedSiteIds: [] };
  }

  async updateMe(_input: UpdateMeInput) {
    return { ok: true };
  }
}

export const meService = new MeService();
