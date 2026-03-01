import { Service } from "typedi";

@Service()
export class ProfilesService {
  async getTeacher(userId: string) {
    return { userId };
  }

  async updateTeacher(_userId: string, _body: any) {
    return { ok: true };
  }

  async getParent(userId: string) {
    return { userId };
  }

  async updateParent(_userId: string, _body: any) {
    return { ok: true };
  }
}
