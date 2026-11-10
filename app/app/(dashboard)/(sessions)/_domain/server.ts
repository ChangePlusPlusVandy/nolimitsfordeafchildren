import { getCurrentSession } from "../_current/service";
import { sessionManagement } from "../_manage/service";
import type { CreateSessionInput, ListSessionsQuery, UpdateSessionInput } from "./types";

export type { CreateSessionInput, ListSessionsQuery, UpdateSessionInput } from "./types";

export class SessionsService {
  async index(query: ListSessionsQuery) {
    return sessionManagement.index(query);
  }

  async create(input: CreateSessionInput) {
    return sessionManagement.create(input);
  }

  async update(id: string, input: UpdateSessionInput) {
    return sessionManagement.update(id, input);
  }

  async getCurrentSession() {
    return getCurrentSession();
  }
}

export const sessionsService = new SessionsService();
