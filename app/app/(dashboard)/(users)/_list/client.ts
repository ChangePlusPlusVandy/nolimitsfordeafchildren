import type { ListUsersQuery, ListUsersResponse } from "../_domain/types";
import { listUsers as serverListUsers } from "./queries";

export async function listUsers(params?: ListUsersQuery): Promise<ListUsersResponse> {
  return serverListUsers(params as never) as never;
}
