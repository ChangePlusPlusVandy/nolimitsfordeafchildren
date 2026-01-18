import { Service } from "typedi";

@Service()
export class TeachersService {
  async index(_query: any) {
    return { items: [], nextCursor: null }
  }

  async create(_body: any) {
    return { id: "new-teacher" }
  }

  async show(_id: string) {
    return { id: _id }
  }

  async update(_id: string, _body: any) {
    return { ok: true }
  }

  async students(_id: string, _query: any) {
    return { items: [], nextCursor: null }
  }

  async myDay(_query: any) {
    return { sessions: [] }
  }

  async createSchedule(_teacherId: string, _body: any) {
    return { id: "new-schedule" }
  }

  async updateSchedule(_scheduleId: string, _body: any) {
    return { ok: true }
  }
}




