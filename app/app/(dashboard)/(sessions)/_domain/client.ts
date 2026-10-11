import { getCurrentSession as serverGetCurrentSession } from "../_current/queries";
import {
  createSession as serverCreateSession,
  updateSession as serverUpdateSession,
} from "../_manage/actions";
import { listSessions as serverListSessions } from "../_manage/queries";
import type { PaginatedSessionsResponse } from "./types";

export type {
  CreateSessionInput,
  ListSessionsQuery,
  PaginatedSessionsResponse,
  SessionEntity,
  UpdateSessionInput,
} from "./types";

export async function listSessions(
  params?: import("./types").ListSessionsQuery,
): Promise<PaginatedSessionsResponse> {
  return serverListSessions(params as never) as never;
}

export async function getCurrentSession() {
  return serverGetCurrentSession();
}

export async function createSession(input: import("./types").CreateSessionInput) {
  return serverCreateSession(input);
}

export async function updateSession(id: string, input: import("./types").UpdateSessionInput) {
  return serverUpdateSession(id, input);
}
