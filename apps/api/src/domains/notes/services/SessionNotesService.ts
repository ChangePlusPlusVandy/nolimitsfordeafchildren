import { Service } from "typedi";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";
import {
  SessionNoteTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
  ScheduleTable,
  type SessionNoteEntity,
  type SessionNoteInsert,
} from "@/db/schema";

export interface CreateSessionNoteInput {
  student_id: string;
  teacher_id: string;
  schedule_id?: string;
  session_date?: string;
  note: string;
}

export interface SessionNoteWithDetails extends SessionNoteEntity {
  teacher?: {
    id: string;
    name: string;
  };
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
}

@Service()
export class SessionNotesService {
  /**
   * Create a new session note
   */
  async create(input: CreateSessionNoteInput): Promise<SessionNoteEntity> {
    // Verify student exists
    const student = await db
      .select()
      .from(StudentTable)
      .where(eq(StudentTable.id, input.student_id))
      .limit(1);

    if (student.length === 0) {
      throw new Error("Student not found");
    }

    // Verify teacher exists
    const teacher = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.id, input.teacher_id))
      .limit(1);

    if (teacher.length === 0) {
      throw new Error("Teacher not found");
    }

    const newNote: SessionNoteInsert = {
      student_id: input.student_id,
      teacher_id: input.teacher_id,
      schedule_id: input.schedule_id || null,
      session_date: input.session_date || null,
      note: input.note,
    };

    const result = await db.insert(SessionNoteTable).values(newNote).returning();

    return result[0]!;
  }

  /**
   * List notes for a student
   */
  async listForStudent(
    studentId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<SessionNoteWithDetails>> {
    const { page, limit, offset } = getPagination(query, 20, 100);

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(SessionNoteTable)
      .where(eq(SessionNoteTable.student_id, studentId));

    const total = countResult[0]?.count ?? 0;

    const results = await db
      .select({
        id: SessionNoteTable.id,
        student_id: SessionNoteTable.student_id,
        teacher_id: SessionNoteTable.teacher_id,
        schedule_id: SessionNoteTable.schedule_id,
        session_date: SessionNoteTable.session_date,
        note: SessionNoteTable.note,
        created_at: SessionNoteTable.created_at,
        updated_at: SessionNoteTable.updated_at,
        teacher_name: UserTable.name,
      })
      .from(SessionNoteTable)
      .innerJoin(TeacherProfileTable, eq(SessionNoteTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(eq(SessionNoteTable.student_id, studentId))
      .orderBy(desc(SessionNoteTable.created_at), desc(SessionNoteTable.id))
      .limit(limit)
      .offset(offset);

    const items = results.map((row) => ({
      id: row.id,
      student_id: row.student_id,
      teacher_id: row.teacher_id,
      schedule_id: row.schedule_id,
      session_date: row.session_date,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
      teacher: {
        id: row.teacher_id,
        name: row.teacher_name,
      },
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * List notes by a teacher
   */
  async listByTeacher(
    teacherId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<SessionNoteWithDetails>> {
    const { page, limit, offset } = getPagination(query, 20, 100);

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(SessionNoteTable)
      .where(eq(SessionNoteTable.teacher_id, teacherId));

    const total = countResult[0]?.count ?? 0;

    const results = await db
      .select({
        id: SessionNoteTable.id,
        student_id: SessionNoteTable.student_id,
        teacher_id: SessionNoteTable.teacher_id,
        schedule_id: SessionNoteTable.schedule_id,
        session_date: SessionNoteTable.session_date,
        note: SessionNoteTable.note,
        created_at: SessionNoteTable.created_at,
        updated_at: SessionNoteTable.updated_at,
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
      })
      .from(SessionNoteTable)
      .innerJoin(StudentTable, eq(SessionNoteTable.student_id, StudentTable.id))
      .where(eq(SessionNoteTable.teacher_id, teacherId))
      .orderBy(desc(SessionNoteTable.created_at), desc(SessionNoteTable.id))
      .limit(limit)
      .offset(offset);

    const items = results.map((row) => ({
      id: row.id,
      student_id: row.student_id,
      teacher_id: row.teacher_id,
      schedule_id: row.schedule_id,
      session_date: row.session_date,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
      student: {
        id: row.student_id,
        initials: row.student_initials,
        first_name: row.student_first_name,
        last_name: row.student_last_name,
      },
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get a single note by ID
   */
  async show(id: string): Promise<SessionNoteWithDetails | null> {
    const results = await db
      .select({
        id: SessionNoteTable.id,
        student_id: SessionNoteTable.student_id,
        teacher_id: SessionNoteTable.teacher_id,
        schedule_id: SessionNoteTable.schedule_id,
        session_date: SessionNoteTable.session_date,
        note: SessionNoteTable.note,
        created_at: SessionNoteTable.created_at,
        updated_at: SessionNoteTable.updated_at,
        teacher_name: UserTable.name,
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
      })
      .from(SessionNoteTable)
      .innerJoin(TeacherProfileTable, eq(SessionNoteTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .innerJoin(StudentTable, eq(SessionNoteTable.student_id, StudentTable.id))
      .where(eq(SessionNoteTable.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0]!;
    return {
      id: row.id,
      student_id: row.student_id,
      teacher_id: row.teacher_id,
      schedule_id: row.schedule_id,
      session_date: row.session_date,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
      teacher: {
        id: row.teacher_id,
        name: row.teacher_name,
      },
      student: {
        id: row.student_id,
        initials: row.student_initials,
        first_name: row.student_first_name,
        last_name: row.student_last_name,
      },
    };
  }

  /**
   * Update a note (only by the teacher who created it)
   */
  async update(id: string, teacherId: string, note: string): Promise<SessionNoteEntity | null> {
    // Verify the note exists and belongs to this teacher
    const existing = await db
      .select()
      .from(SessionNoteTable)
      .where(and(eq(SessionNoteTable.id, id), eq(SessionNoteTable.teacher_id, teacherId)))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const result = await db
      .update(SessionNoteTable)
      .set({
        note,
        updated_at: new Date(),
      })
      .where(eq(SessionNoteTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Delete a note (only by the teacher who created it or admin)
   */
  async delete(id: string, teacherId?: string): Promise<boolean> {
    const conditions = [eq(SessionNoteTable.id, id)];

    if (teacherId) {
      conditions.push(eq(SessionNoteTable.teacher_id, teacherId));
    }

    const result = await db
      .delete(SessionNoteTable)
      .where(and(...conditions))
      .returning();

    return result.length > 0;
  }
}
