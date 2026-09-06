export class ProfilesService {
  async getTeacher(userId: string) {
    return { userId };
  }

  async updateTeacher(_userId: string, _body: unknown) {
    return { ok: true };
  }

  async getParent(userId: string) {
    return { userId };
  }

  async updateParent(_userId: string, _body: unknown) {
    return { ok: true };
  }
}
