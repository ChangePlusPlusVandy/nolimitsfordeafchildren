import { Service } from "typedi";

@Service()
export class SchedulesService {
  async index(_query: any) {
    return { items: [], nextCursor: null }
  }

  async checkConflicts(_body: any) {
    return { conflicts: [] }
  }
}




