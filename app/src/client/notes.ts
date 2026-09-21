/**
 * Thin client data-access layer for Session Notes.
 *
 * Names reconcile 1:1 with `src/server/notes/{queries,actions}.ts`.
 */

import {
  createNote as serverCreateNote,
  deleteNote as serverDeleteNote,
  updateNote as serverUpdateNote,
} from "@/server/notes/actions";
import { listStudentNotes as serverListStudentNotes } from "@/server/notes/queries";

export interface SessionNote {
  id: string;
  student_id: string;
  teacher_id: string;
  schedule_id: string | null;
  session_date: string | null;
  note: string;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    name: string;
  };
}

export interface PaginatedNotesResponse {
  items: SessionNote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listNotesForStudent(
  studentId: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedNotesResponse> {
  return serverListStudentNotes(studentId, params) as never;
}

export async function createNote(studentId: string, note: string) {
  return serverCreateNote(studentId, { note });
}

export async function updateNote(id: string, note: string) {
  return serverUpdateNote(id, { note });
}

export async function deleteNote(id: string) {
  return serverDeleteNote(id);
}
