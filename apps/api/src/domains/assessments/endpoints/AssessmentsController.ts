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
import { AssessmentsService, type CreateAssessmentInput } from "../services/AssessmentsService";
import type { UserEntity } from "@/db/schema";
import { db } from "@/db";
import { TeacherProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateAssessmentBody {
  cycle_start_date: string;
  assessment_type: "pre" | "post";
  teaching_focus: string;
  score: number;
  notes?: string;
}

interface UpdateAssessmentBody {
  teaching_focus?: string;
  score?: number;
  notes?: string;
}

/**
 * List assessments for a student, grouped by cycle
 * GET /v1/students/:studentId/assessments
 */
@Service()
@JsonController("/v1")
export class GetStudentAssessmentsController {
  private assessmentsService: AssessmentsService;
  constructor() {
    this.assessmentsService = Container.get(AssessmentsService);
  }

  @Get("/students/:studentId/assessments")
  @Authorized(["administrator", "teacher", "parent"])
  async handle(@Param("studentId") studentId: string) {
    const cycles = await this.assessmentsService.listForStudent(studentId);
    return { items: cycles };
  }
}

/**
 * Create an assessment for a student
 * POST /v1/students/:studentId/assessments
 */
@Service()
@JsonController("/v1")
export class PostStudentAssessmentsController {
  private assessmentsService: AssessmentsService;
  constructor() {
    this.assessmentsService = Container.get(AssessmentsService);
  }

  @Post("/students/:studentId/assessments")
  @Authorized(["teacher"])
  async handle(
    @Param("studentId") studentId: string,
    @Body() body: CreateAssessmentBody,
    @CurrentUser({ required: true }) currentUser: UserEntity
  ) {
    // Get teacher profile for current user
    const teacherProfile = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, currentUser.id))
      .limit(1);

    if (teacherProfile.length === 0) {
      throw new HttpError(403, "Only teachers can create assessments");
    }

    const input: CreateAssessmentInput = {
      student_id: studentId,
      teacher_id: teacherProfile[0]!.id,
      cycle_start_date: body.cycle_start_date,
      assessment_type: body.assessment_type,
      teaching_focus: body.teaching_focus,
      score: body.score,
      notes: body.notes,
    };

    try {
      const assessment = await this.assessmentsService.create(input);
      return assessment;
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        throw new HttpError(409, error.message);
      }
      if (error.message.includes("Score must be")) {
        throw new HttpError(400, error.message);
      }
      throw error;
    }
  }
}

/**
 * Get a single assessment
 * GET /v1/assessments/:id
 */
@Service()
@JsonController("/v1")
export class GetAssessmentController {
  private assessmentsService: AssessmentsService;
  constructor() {
    this.assessmentsService = Container.get(AssessmentsService);
  }

  @Get("/assessments/:id")
  @Authorized(["administrator", "teacher", "parent"])
  async handle(@Param("id") id: string) {
    const assessment = await this.assessmentsService.show(id);
    if (!assessment) {
      throw new HttpError(404, "Assessment not found");
    }
    return assessment;
  }
}

/**
 * Update an assessment
 * PATCH /v1/assessments/:id
 */
@Service()
@JsonController("/v1")
export class PatchAssessmentController {
  private assessmentsService: AssessmentsService;
  constructor() {
    this.assessmentsService = Container.get(AssessmentsService);
  }

  @Patch("/assessments/:id")
  @Authorized(["teacher"])
  async handle(
    @Param("id") id: string,
    @Body() body: UpdateAssessmentBody,
    @CurrentUser({ required: true }) currentUser: UserEntity
  ) {
    // Get teacher profile for current user
    const teacherProfile = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, currentUser.id))
      .limit(1);

    if (teacherProfile.length === 0) {
      throw new HttpError(403, "Only teachers can update assessments");
    }

    try {
      const assessment = await this.assessmentsService.update(
        id,
        teacherProfile[0]!.id,
        body
      );
      if (!assessment) {
        throw new HttpError(404, "Assessment not found or you don't have permission to update it");
      }
      return assessment;
    } catch (error: any) {
      if (error.message.includes("Score must be")) {
        throw new HttpError(400, error.message);
      }
      throw error;
    }
  }
}

/**
 * Delete an assessment
 * DELETE /v1/assessments/:id
 */
@Service()
@JsonController("/v1")
export class DeleteAssessmentController {
  private assessmentsService: AssessmentsService;
  constructor() {
    this.assessmentsService = Container.get(AssessmentsService);
  }

  @Delete("/assessments/:id")
  @Authorized(["administrator", "teacher"])
  async handle(
    @Param("id") id: string,
    @CurrentUser({ required: true }) currentUser: UserEntity
  ) {
    let teacherId: string | undefined;

    // If not admin, get teacher profile to ensure they own the assessment
    if (currentUser.role !== "administrator") {
      const teacherProfile = await db
        .select()
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, currentUser.id))
        .limit(1);

      if (teacherProfile.length === 0) {
        throw new HttpError(403, "Only teachers can delete assessments");
      }
      teacherId = teacherProfile[0]!.id;
    }

    const deleted = await this.assessmentsService.delete(id, teacherId);
    if (!deleted) {
      throw new HttpError(404, "Assessment not found or you don't have permission to delete it");
    }
    return { success: true };
  }
}
