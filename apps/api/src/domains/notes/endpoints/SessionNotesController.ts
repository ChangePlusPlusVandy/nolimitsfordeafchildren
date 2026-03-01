import {
  Get,
  Post,
  Patch,
  Delete,
  JsonController,
  Param,
  Body,
  CurrentUser,
  Authorized,
  HttpError,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { SessionNotesService, type CreateSessionNoteInput } from "../services/SessionNotesService";
import type { UserEntity } from "@/db/schema";
import { db } from "@/db";
import { TeacherProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateNoteBody {
  note: string;
  schedule_id?: string;
  session_date?: string;
}

interface UpdateNoteBody {
  note: string;
}

/**
 * Get session notes for a student
 * GET /v1/students/:studentId/notes
 */
@Service()
@JsonController("/v1")
export class GetStudentNotesController {
  private notesService: SessionNotesService;
  constructor() {
    this.notesService = Container.get(SessionNotesService);
  }

  @Get("/students/:studentId/notes")
  @Authorized(["administrator", "teacher", "parent"])
  async handle(@Param("studentId") studentId: string) {
    const notes = await this.notesService.listForStudent(studentId);
    return { items: notes };
  }
}

/**
 * Create a session note for a student
 * POST /v1/students/:studentId/notes
 */
@Service()
@JsonController("/v1")
export class PostStudentNotesController {
  private notesService: SessionNotesService;
  constructor() {
    this.notesService = Container.get(SessionNotesService);
  }

  @Post("/students/:studentId/notes")
  @Authorized(["teacher"])
  async handle(
    @Param("studentId") studentId: string,
    @Body() body: CreateNoteBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    // Get teacher profile for current user
    const teacherProfile = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, currentUser.id))
      .limit(1);

    if (teacherProfile.length === 0) {
      throw new HttpError(403, "Only teachers can create session notes");
    }

    const input: CreateSessionNoteInput = {
      student_id: studentId,
      teacher_id: teacherProfile[0]!.id,
      schedule_id: body.schedule_id,
      session_date: body.session_date,
      note: body.note,
    };

    const note = await this.notesService.create(input);
    return note;
  }
}

/**
 * Get a single session note
 * GET /v1/notes/:id
 */
@Service()
@JsonController("/v1")
export class GetNoteController {
  private notesService: SessionNotesService;
  constructor() {
    this.notesService = Container.get(SessionNotesService);
  }

  @Get("/notes/:id")
  @Authorized(["administrator", "teacher", "parent"])
  async handle(@Param("id") id: string) {
    const note = await this.notesService.show(id);
    if (!note) {
      throw new HttpError(404, "Note not found");
    }
    return note;
  }
}

/**
 * Update a session note
 * PATCH /v1/notes/:id
 */
@Service()
@JsonController("/v1")
export class PatchNoteController {
  private notesService: SessionNotesService;
  constructor() {
    this.notesService = Container.get(SessionNotesService);
  }

  @Patch("/notes/:id")
  @Authorized(["teacher"])
  async handle(
    @Param("id") id: string,
    @Body() body: UpdateNoteBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    // Get teacher profile for current user
    const teacherProfile = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, currentUser.id))
      .limit(1);

    if (teacherProfile.length === 0) {
      throw new HttpError(403, "Only teachers can update session notes");
    }

    const note = await this.notesService.update(id, teacherProfile[0]!.id, body.note);
    if (!note) {
      throw new HttpError(404, "Note not found or you don't have permission to update it");
    }
    return note;
  }
}

/**
 * Delete a session note
 * DELETE /v1/notes/:id
 */
@Service()
@JsonController("/v1")
export class DeleteNoteController {
  private notesService: SessionNotesService;
  constructor() {
    this.notesService = Container.get(SessionNotesService);
  }

  @Delete("/notes/:id")
  @Authorized(["administrator", "teacher"])
  async handle(@Param("id") id: string, @CurrentUser({ required: true }) currentUser: UserEntity) {
    let teacherId: string | undefined;

    // If not admin, get teacher profile to ensure they own the note
    if (currentUser.role !== "administrator") {
      const teacherProfile = await db
        .select()
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, currentUser.id))
        .limit(1);

      if (teacherProfile.length === 0) {
        throw new HttpError(403, "Only teachers can delete session notes");
      }
      teacherId = teacherProfile[0]!.id;
    }

    const deleted = await this.notesService.delete(id, teacherId);
    if (!deleted) {
      throw new HttpError(404, "Note not found or you don't have permission to delete it");
    }
    return { success: true };
  }
}

/**
 * Get notes by a teacher
 * GET /v1/teachers/:teacherId/notes
 */
@Service()
@JsonController("/v1")
export class GetTeacherNotesController {
  private notesService: SessionNotesService;
  constructor() {
    this.notesService = Container.get(SessionNotesService);
  }

  @Get("/teachers/:teacherId/notes")
  @Authorized(["administrator", "teacher"])
  async handle(@Param("teacherId") teacherId: string) {
    const notes = await this.notesService.listByTeacher(teacherId);
    return { items: notes };
  }
}
