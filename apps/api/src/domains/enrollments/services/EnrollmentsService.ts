import { Service } from "typedi";

@Service()
export class EnrollmentsService {
  async index(_query: any) {
    return { items: [], nextCursor: null }
  }

  async create(_body: any) {
    return { id: "new-enrollment" }
  }

  async update(_id: string, _body: any) {
    return { ok: true }
  }
}




