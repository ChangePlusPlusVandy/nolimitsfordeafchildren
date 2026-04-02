import {
  Body,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParam,
  CurrentUser,
  Authorized,
  HttpCode,
  BadRequestError,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import {
  AttendanceService,
  type MarkAttendanceInput,
  type UpdateAttendanceInput,
  type ListAttendanceQuery,
  type AttendanceStatus,
} from "../services/AttendanceService";
import type { UserEntity } from "@/db/schema";

@Service()
@JsonController("/v1")
export class PostAttendanceController {
  private attendanceService: AttendanceService;
  constructor() {
    this.attendanceService = Container.get(AttendanceService);
  }

  /**
   * Mark attendance for a student session
   * POST /v1/attendance
   */
  @Post("/attendance")
  @Authorized(["teacher", "administrator"])
  @HttpCode(201)
  async handle(
    @Body() body: Omit<MarkAttendanceInput, "marked_by">,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    try {
      return await this.attendanceService.mark({
        ...body,
        marked_by: currentUser.id,
      });
    } catch (error: any) {
      if (error?.message?.includes("Late minutes must be")) {
        throw new BadRequestError("Late minutes must be one of: 10, 15, or 30");
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class PatchAttendanceController {
  private attendanceService: AttendanceService;
  constructor() {
    this.attendanceService = Container.get(AttendanceService);
  }

  /**
   * Update an attendance record
   * PATCH /v1/attendance/:id
   */
  @Patch("/attendance/:id")
  @Authorized(["teacher", "administrator"])
  async handle(
    @Param("id") id: string,
    @Body() body: UpdateAttendanceInput,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    try {
      const result = await this.attendanceService.update(id, body, currentUser.id);
      if (!result) {
        throw new Error("Attendance record not found");
      }
      return result;
    } catch (error: any) {
      if (error?.message?.includes("Late minutes must be")) {
        throw new BadRequestError("Late minutes must be one of: 10, 15, or 30");
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class GetAttendanceController {
  private attendanceService: AttendanceService;
  constructor() {
    this.attendanceService = Container.get(AttendanceService);
  }

  /**
   * List attendance records with filters
   * GET /v1/attendance
   */
  @Get("/attendance")
  @Authorized()
  async handle(
    @QueryParam("student_id") student_id?: string,
    @QueryParam("schedule_id") schedule_id?: string,
    @QueryParam("teacher_id") teacher_id?: string,
    @QueryParam("site_id") site_id?: string,
    @QueryParam("date_from") date_from?: string,
    @QueryParam("date_to") date_to?: string,
    @QueryParam("status") status?: AttendanceStatus,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    const query: ListAttendanceQuery = {
      student_id,
      schedule_id,
      teacher_id,
      site_id,
      date_from,
      date_to,
      status,
      page,
      limit,
    };
    return await this.attendanceService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class GetAttendanceSiblingParticipationReportController {
  private attendanceService: AttendanceService;
  constructor() {
    this.attendanceService = Container.get(AttendanceService);
  }

  @Get("/attendance/sibling-participation-report")
  @Authorized(["administrator"])
  async handle(
    @QueryParam("date_from") date_from?: string,
    @QueryParam("date_to") date_to?: string,
    @QueryParam("site_id") site_id?: string,
  ) {
    return await this.attendanceService.getSiblingParticipationReport({
      date_from,
      date_to,
      site_id,
    });
  }
}

@Service()
@JsonController("/v1")
export class GetAttendanceShowController {
  private attendanceService: AttendanceService;
  constructor() {
    this.attendanceService = Container.get(AttendanceService);
  }

  /**
   * Get a single attendance record
   * GET /v1/attendance/:id
   */
  @Get("/attendance/:id")
  @Authorized()
  async handle(@Param("id") id: string) {
    const result = await this.attendanceService.show(id);
    if (!result) {
      throw new Error("Attendance record not found");
    }
    return result;
  }
}

@Service()
@JsonController("/v1")
export class GetStudentAttendanceSummaryController {
  private attendanceService: AttendanceService;
  constructor() {
    this.attendanceService = Container.get(AttendanceService);
  }

  /**
   * Get attendance summary for a student
   * GET /v1/students/:id/attendance/summary
   */
  @Get("/students/:id/attendance/summary")
  @Authorized()
  async handle(@Param("id") studentId: string) {
    return await this.attendanceService.getSummary(studentId);
  }
}
