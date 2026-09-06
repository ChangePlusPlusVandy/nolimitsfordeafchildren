import { buildPaginatedResponse, getPagination, type PaginatedQuery } from "@/utils/pagination";

interface EnrollmentsListQuery extends PaginatedQuery {
  student_id?: string;
  schedule_id?: string;
  is_active?: boolean;
}

export class EnrollmentsService {
  async index(query: EnrollmentsListQuery) {
    const { page, limit } = getPagination(query, 20, 100);
    return buildPaginatedResponse([], 0, page, limit);
  }

  async create(_body: unknown) {
    return { id: "new-enrollment" };
  }

  async update(_id: string, _body: unknown) {
    return { ok: true };
  }
}
