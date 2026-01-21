import { Body, Get, JsonController, Param, Patch, Post, QueryParams, CurrentUser, Authorized, HttpCode } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { AttendanceService, type MarkAttendanceInput, type UpdateAttendanceInput, type ListAttendanceQuery } from "../services/AttendanceService";
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
    @CurrentUser({ required: true }) currentUser: UserEntity
  ) {
    return await this.attendanceService.mark({
      ...body,
      marked_by: currentUser.id,
    });
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
    @CurrentUser({ required: true }) currentUser: UserEntity
  ) {
    const result = await this.attendanceService.update(id, body, currentUser.id);
    if (!result) {
      throw new Error("Attendance record not found");
    }
    return result;
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
  async handle(@QueryParams() query: ListAttendanceQuery) {
    return await this.attendanceService.index(query);
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
