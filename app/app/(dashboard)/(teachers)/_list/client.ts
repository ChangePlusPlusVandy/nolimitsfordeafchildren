import type { ListTeachersQuery, ListTeachersResponse } from "../_domain/types";
import { listTeachers as serverListTeachers } from "./queries";

export async function listTeachers(params?: ListTeachersQuery): Promise<ListTeachersResponse> {
  return serverListTeachers(params as never) as never;
}
