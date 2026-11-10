import { deleteNote as serverDeleteNote } from "./actions";

export async function deleteNote(id: string) {
  return serverDeleteNote(id);
}
