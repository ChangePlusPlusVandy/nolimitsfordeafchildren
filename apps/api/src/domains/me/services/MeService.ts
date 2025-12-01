import { Service } from "typedi";

@Service()
export class MeService {
  async getMe() {
    return { id: "me", role: "administrator", allowedSiteIds: [] }
  }

  async updateMe(_input: any) {
    return { ok: true }
  }
}




