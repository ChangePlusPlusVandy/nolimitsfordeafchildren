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
  ScheduleChangeService,
  type CreateScheduleChangeInput,
  type RequestStatus,
} from "../services/ScheduleChangeService";
import type { UserEntity } from "@/db/schema";

interface CreateScheduleChangeRequestBody {
  student_id: string;
  current_schedule_id: string;
  requested_schedule_id: string;
  reason: string;
}

interface ReviewScheduleChangeRequestBody {
  status: "approved" | "denied";
  review_notes?: string;
}

/**
 * Create a schedule change request (parent)
 * POST /v1/schedule-change-requests
 */
@Service()
@JsonController("/v1")
export class PostScheduleChangeRequestController {
  private scheduleChangeService: ScheduleChangeService;
  constructor() {
    this.scheduleChangeService = Container.get(ScheduleChangeService);
  }

  @Post("/schedule-change-requests")
  @Authorized(["parent", "administrator"])
  async handle(
    @Body() body: CreateScheduleChangeRequestBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    const input: CreateScheduleChangeInput = {
      student_id: body.student_id,
      current_schedule_id: body.current_schedule_id,
      requested_schedule_id: body.requested_schedule_id,
      reason: body.reason,
      requested_by: currentUser.id,
    };

    try {
      const request = await this.scheduleChangeService.createRequest(input);
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
 * List schedule change requests (admin)
 * GET /v1/schedule-change-requests
 */
@Service()
@JsonController("/v1")
export class GetScheduleChangeRequestsController {
  private scheduleChangeService: ScheduleChangeService;
  constructor() {
    this.scheduleChangeService = Container.get(ScheduleChangeService);
  }

  @Get("/schedule-change-requests")
  @Authorized(["administrator"])
  async handle(
    @QueryParam("status") status?: RequestStatus,
    @QueryParam("student_id") studentId?: string,
    @QueryParam("site_id") siteId?: string,
    @QueryParam("limit") limit?: number,
  ) {
    const result = await this.scheduleChangeService.listRequests({
      status,
      student_id: studentId,
      site_id: siteId,
      limit,
    });
    return result;
  }
}

/**
 * Get a single schedule change request
 * GET /v1/schedule-change-requests/:id
 */
@Service()
@JsonController("/v1")
export class GetScheduleChangeRequestController {
  private scheduleChangeService: ScheduleChangeService;
  constructor() {
    this.scheduleChangeService = Container.get(ScheduleChangeService);
  }

  @Get("/schedule-change-requests/:id")
  @Authorized(["administrator", "parent"])
  async handle(@Param("id") id: string, @CurrentUser({ required: true }) currentUser: UserEntity) {
    if (currentUser.role === "parent") {
      const canView = await this.scheduleChangeService.isRequestVisibleToParent(id, currentUser.id);
      if (!canView) {
        throw new HttpError(404, "Schedule change request not found");
      }
    }

    const request = await this.scheduleChangeService.showRequest(id);
    if (!request) {
      throw new HttpError(404, "Schedule change request not found");
    }
    return request;
  }
}

/**
 * Review a schedule change request (admin approves/denies)
 * PATCH /v1/schedule-change-requests/:id
 */
@Service()
@JsonController("/v1")
export class PatchScheduleChangeRequestController {
  private scheduleChangeService: ScheduleChangeService;
  constructor() {
    this.scheduleChangeService = Container.get(ScheduleChangeService);
  }

  @Patch("/schedule-change-requests/:id")
  @Authorized(["administrator"])
  async handle(
    @Param("id") id: string,
    @Body() body: ReviewScheduleChangeRequestBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    try {
      const request = await this.scheduleChangeService.reviewRequest(
        id,
        currentUser.id,
        body.status,
        body.review_notes,
      );
      if (!request) {
        throw new HttpError(404, "Schedule change request not found");
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
 * Get available schedules for parents to browse
 * GET /v1/schedules/available
 */
@Service()
@JsonController("/v1")
export class GetAvailableSchedulesController {
  private scheduleChangeService: ScheduleChangeService;
  constructor() {
    this.scheduleChangeService = Container.get(ScheduleChangeService);
  }

  @Get("/schedules/available")
  @Authorized(["parent", "administrator"])
  async handle(
    @QueryParam("site_id") siteId?: string,
    @QueryParam("day_pattern") dayPattern?: "mws" | "tths",
    @QueryParam("exclude_current_schedule_id") excludeCurrentScheduleId?: string,
  ) {
    const result = await this.scheduleChangeService.getAvailableSchedules({
      site_id: siteId,
      day_pattern: dayPattern,
      exclude_current_schedule_id: excludeCurrentScheduleId,
    });
    return result;
  }
}

/**
 * Get schedule change requests for the current parent's children
 * GET /v1/parents/me/schedule-change-requests
 */
@Service()
@JsonController("/v1")
export class GetParentScheduleChangeRequestsController {
  private scheduleChangeService: ScheduleChangeService;
  constructor() {
    this.scheduleChangeService = Container.get(ScheduleChangeService);
  }

  @Get("/parents/me/schedule-change-requests")
  @Authorized(["parent"])
  async handle(@CurrentUser({ required: true }) currentUser: UserEntity) {
    const result = await this.scheduleChangeService.listRequestsForParent(currentUser.id);
    return result;
  }
}
