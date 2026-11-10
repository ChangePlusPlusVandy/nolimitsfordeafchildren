import type { ListStudentsResponse, StudentFilters } from "../_domain/types";
import { listStudents as serverListStudents } from "./queries";

export async function listStudents(params?: StudentFilters): Promise<ListStudentsResponse> {
  return serverListStudents(params as never);
}
