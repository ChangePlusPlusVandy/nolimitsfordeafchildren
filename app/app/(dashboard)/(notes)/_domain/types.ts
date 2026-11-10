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

export interface CreateSessionNoteInput {
  student_id: string;
  teacher_id: string;
  schedule_id?: string;
  session_date?: string;
  note: string;
}

export interface SessionNoteWithDetails extends Omit<SessionNote, "created_at" | "updated_at"> {
  created_at: Date;
  updated_at: Date;
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
}
