import { create } from "../_create/service";
import { deleteNote } from "../_delete/service";
import { show } from "../_detail/service";
import { update } from "../_edit/service";
import { listForStudent } from "../_list/service";
import { listByTeacher } from "../_teacher/service";

export type { CreateSessionNoteInput, SessionNoteWithDetails } from "./types";

export class SessionNotesService {
  async create(...args: Parameters<typeof create>) {
    return create(...args);
  }

  async listForStudent(...args: Parameters<typeof listForStudent>) {
    return listForStudent(...args);
  }

  async listByTeacher(...args: Parameters<typeof listByTeacher>) {
    return listByTeacher(...args);
  }

  async show(...args: Parameters<typeof show>) {
    return show(...args);
  }

  async update(...args: Parameters<typeof update>) {
    return update(...args);
  }

  async delete(...args: Parameters<typeof deleteNote>) {
    return deleteNote(...args);
  }
}

export const sessionNotesService = new SessionNotesService();
