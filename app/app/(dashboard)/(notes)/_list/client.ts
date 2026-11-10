import type { PaginatedNotesResponse } from "../_domain/types";
import { listStudentNotes as serverListStudentNotes } from "./queries";

export async function listNotesForStudent(
  studentId: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedNotesResponse> {
  return serverListStudentNotes(studentId, params) as never;
}
