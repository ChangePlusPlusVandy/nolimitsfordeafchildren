import { createNote as serverCreateNote } from "./actions";

export async function createNote(studentId: string, note: string) {
  return serverCreateNote(studentId, { note });
}
