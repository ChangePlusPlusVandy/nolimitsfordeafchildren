import { Service } from "typedi";

@Service()
export class UsersService {
  async index(_query: any) {
    return { items: [], nextCursor: null }
  }

  async invite(_body: any) {
    return { id: "invited-user-id" }
  }

  async update(_id: string, _body: any) {
    return { ok: true }
  }
}




