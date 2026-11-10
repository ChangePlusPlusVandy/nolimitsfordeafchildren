import { updateNote as serverUpdateNote } from "./actions";

export async function updateNote(id: string, note: string) {
  return serverUpdateNote(id, { note });
}
