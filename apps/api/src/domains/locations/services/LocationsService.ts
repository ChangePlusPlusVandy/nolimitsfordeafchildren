import { Service } from "typedi";

@Service()
export class LocationsService {
  async index(_query: any) {
    return { items: [], nextCursor: null }
  }

  async create(_body: any) {
    return { id: "new-site" }
  }

  async show(_siteId: string) {
    return { id: _siteId }
  }

  async update(_siteId: string, _body: any) {
    return { ok: true }
  }

  async mapSummary() {
    return []
  }

  async nowNext(_siteId: string, _query: any) {
    return { now: [], next: [] }
  }
}




