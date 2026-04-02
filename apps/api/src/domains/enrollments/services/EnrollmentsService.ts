import { Service } from "typedi";
import { buildPaginatedResponse, getPagination, type PaginatedQuery } from "@/utils/pagination";

interface EnrollmentsListQuery extends PaginatedQuery {
  student_id?: string;
  schedule_id?: string;
  is_active?: boolean;
}

@Service()
export class EnrollmentsService {
  async index(query: EnrollmentsListQuery) {
    const { page, limit } = getPagination(query, 20, 100);
    return buildPaginatedResponse([], 0, page, limit);
  }

  async create(_body: any) {
    return { id: "new-enrollment" };
  }

  async update(_id: string, _body: any) {
    return { ok: true };
  }
}
