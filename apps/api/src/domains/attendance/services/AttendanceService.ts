import { Service } from "typedi";

@Service()
export class AttendanceService {
  async create(_body: any) {
    return { id: "new-attendance" }
  }

  async update(_id: string, _body: any) {
    return { ok: true }
  }

  async index(_query: any) {
    return { items: [], nextCursor: null }
  }
}




