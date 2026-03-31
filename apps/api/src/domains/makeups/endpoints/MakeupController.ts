import {
  Get,
  Post,
  Patch,
  JsonController,
  Param,
  Body,
  QueryParam,
  CurrentUser,
  Authorized,
  HttpError,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import {
  MakeupService,
  type CreateMakeupRequestInput,
  type CreateMakeupSessionInput,
  type AbsenceReason,
  type RequestStatus,
  type AttendanceStatus,
} from "../services/MakeupService";
import type { UserEntity } from "@/db/schema";
import { db } from "@/db";
import { TeacherProfileTable, ParentProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateMakeupRequestBody {
  student_id: string;
  original_session_date: string;
  original_schedule_id: string;
  reason: AbsenceReason;
  reason_text?: string;
  preferred_dates?: string;
}

interface ReviewMakeupRequestBody {
  status: "approved" | "denied";
  review_notes?: string;
}

interface CreateMakeupSessionBody {
  makeup_request_id?: string;
  student_id: string;
  teacher_id: string;
  site_id: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
}

interface MarkAttendanceBody {
  status: AttendanceStatus;
}

/**
 * Create a makeup request (parent)
 * POST /v1/makeup-requests
 */
@Service()
@JsonController("/v1")
export class PostMakeupRequestController {
  private makeupService: MakeupService;
  constructor() {
    this.makeupService = Container.get(MakeupService);
  }

  @Post("/makeup-requests")
  @Authorized(["parent", "administrator"])
  async handle(
    @Body() body: CreateMakeupRequestBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    const input: CreateMakeupRequestInput = {
      student_id: body.student_id,
      original_session_date: body.original_session_date,
      original_schedule_id: body.original_schedule_id,
      reason: body.reason,
      reason_text: body.reason_text,
      preferred_dates: body.preferred_dates,
      requested_by: currentUser.id,
    };

    try {
      const request = await this.makeupService.createRequest(input);
      return request;
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        throw new HttpError(409, error.message);
      }
      if (error.message.includes("not found")) {
        throw new HttpError(404, error.message);
      }
      throw error;
    }
  }
}

/**
 * List makeup requests (admin)
 * GET /v1/makeup-requests
 */
@Service()
@JsonController("/v1")
export class GetMakeupRequestsController {
  private makeupService: MakeupService;
  constructor() {
    this.makeupService = Container.get(MakeupService);
  }

  @Get("/makeup-requests")
  @Authorized(["administrator"])
  async handle(
    @QueryParam("status") status?: RequestStatus,
    @QueryParam("student_id") studentId?: string,
    @QueryParam("site_id") siteId?: string,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    const result = await this.makeupService.listRequests({
      status,
      student_id: studentId,
      site_id: siteId,
      page,
      limit,
    });
    return result;
  }
}

/**
 * Get a single makeup request
 * GET /v1/makeup-requests/:id
 */
@Service()
@JsonController("/v1")
export class GetMakeupRequestController {
  private makeupService: MakeupService;
  constructor() {
    this.makeupService = Container.get(MakeupService);
  }

  @Get("/makeup-requests/:id")
  @Authorized(["administrator", "parent"])
  async handle(@Param("id") id: string, @CurrentUser({ required: true }) currentUser: UserEntity) {
    if (currentUser.role === "parent") {
      const canView = await this.makeupService.isRequestVisibleToParent(id, currentUser.id);
      if (!canView) {
        throw new HttpError(404, "Makeup request not found");
      }
    }

    const request = await this.makeupService.showRequest(id);
    if (!request) {
      throw new HttpError(404, "Makeup request not found");
    }
    return request;
  }
}

/**
 * Review a makeup request (admin approves/denies)
 * PATCH /v1/makeup-requests/:id
 */
@Service()
@JsonController("/v1")
export class PatchMakeupRequestController {
  private makeupService: MakeupService;
  constructor() {
    this.makeupService = Container.get(MakeupService);
  }

  @Patch("/makeup-requests/:id")
  @Authorized(["administrator"])
  async handle(
    @Param("id") id: string,
    @Body() body: ReviewMakeupRequestBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    try {
      const request = await this.makeupService.reviewRequest(
        id,
        currentUser.id,
        body.status,
        body.review_notes,
      );
      if (!request) {
        throw new HttpError(404, "Makeup request not found");
      }
      return request;
    } catch (error: any) {
      if (error.message.includes("already been reviewed")) {
        throw new HttpError(409, error.message);
      }
      throw error;
    }
  }
}

/**
 * Create a makeup session (admin)
 * POST /v1/makeup-sessions
 */
@Service()
@JsonController("/v1")
export class PostMakeupSessionController {
  private makeupService: MakeupService;
  constructor() {
    this.makeupService = Container.get(MakeupService);
  }

  @Post("/makeup-sessions")
  @Authorized(["administrator"])
  async handle(
    @Body() body: CreateMakeupSessionBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    const input: CreateMakeupSessionInput = {
      makeup_request_id: body.makeup_request_id,
      student_id: body.student_id,
      teacher_id: body.teacher_id,
      site_id: body.site_id,
      scheduled_date: body.scheduled_date,
      scheduled_time: body.scheduled_time,
      notes: body.notes,
      created_by: currentUser.id,
    };

    try {
      const session = await this.makeupService.createSession(input);
      return session;
    } catch (error: any) {
      if (error.message.includes("not found")) {
        throw new HttpError(404, error.message);
      }
      throw error;
    }
  }
}

/**
 * Get makeup sessions for a teacher
 * GET /v1/teachers/:teacherId/makeup-sessions
 */
@Service()
@JsonController("/v1")
export class GetTeacherMakeupSessionsController {
  private makeupService: MakeupService;
  constructor() {
    this.makeupService = Container.get(MakeupService);
  }

  @Get("/teachers/:teacherId/makeup-sessions")
  @Authorized(["administrator", "teacher"])
  async handle(
    @Param("teacherId") teacherId: string,
    @CurrentUser({ required: true }) currentUser: UserEntity,
    @QueryParam("date") date?: string,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    if (currentUser.role === "teacher") {
      const canView = await this.makeupService.isTeacherAuthorizedForSession(currentUser.id, teacherId);
      if (!canView) {
        throw new HttpError(403, "You can only view your own makeup sessions");
      }
    }

    const result = await this.makeupService.listSessionsForTeacher(teacherId, { date, page, limit });
    return result;
  }
}

/**
 * Mark attendance for a makeup session
 * PATCH /v1/makeup-sessions/:id/attendance
 */
@Service()
@JsonController("/v1")
export class PatchMakeupSessionAttendanceController {
  private makeupService: MakeupService;
  constructor() {
    this.makeupService = Container.get(MakeupService);
  }

  @Patch("/makeup-sessions/:id/attendance")
  @Authorized(["administrator", "teacher"])
  async handle(@Param("id") id: string, @Body() body: MarkAttendanceBody) {
    const session = await this.makeupService.markSessionAttendance(id, body.status);
    if (!session) {
      throw new HttpError(404, "Makeup session not found");
    }
    return session;
  }
}

/**
 * Get makeup requests for the current parent's children
 * GET /v1/parents/me/makeup-requests
 */
@Service()
@JsonController("/v1")
export class GetParentMakeupRequestsController {
  private makeupService: MakeupService;
  constructor() {
    this.makeupService = Container.get(MakeupService);
  }

  @Get("/parents/me/makeup-requests")
  @Authorized(["parent"])
  async handle(
    @CurrentUser({ required: true }) currentUser: UserEntity,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    const result = await this.makeupService.listRequestsForParent(currentUser.id, { page, limit });
    return result;
  }
}
