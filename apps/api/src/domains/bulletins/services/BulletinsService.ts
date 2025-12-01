import { Service } from "typedi";

@Service()
export class BulletinsService {
  async index(_query: any) {
    return { items: [], nextCursor: null }
  }

  async create(_body: any) {
    return { id: "new-bulletin" }
  }

  async update(_id: string, _body: any) {
    return { ok: true }
  }

  async remove(_id: string) {
    return
  }
}




