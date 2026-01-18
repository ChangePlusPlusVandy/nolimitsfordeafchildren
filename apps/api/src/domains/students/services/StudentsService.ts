import { Service } from "typedi";

@Service()
export class StudentsService {
  async index(_query: any) {
    return { items: [], nextCursor: null }
  }

  async create(_body: any) {
    return { id: "new-student" }
  }

  async show(_id: string) {
    return { id: _id }
  }

  async update(_id: string, _body: any) {
    return { ok: true }
  }

  async teachers(_id: string, _query: any) {
    return { items: [], nextCursor: null }
  }

  async assignTeacher(_id: string, _body: any) {
    return { ok: true }
  }

  async unassignTeacher(_id: string, _teacherId: string) {
    return { ok: true }
  }

  async parents(_id: string) {
    return { items: [] }
  }

  async addParent(_id: string, _body: any) {
    return { ok: true }
  }

  async removeParent(_id: string, _parentId: string) {
    return { ok: true }
  }
}


