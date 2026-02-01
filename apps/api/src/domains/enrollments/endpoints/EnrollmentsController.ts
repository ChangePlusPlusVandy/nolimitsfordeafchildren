import { Body, Get, JsonController, Patch, Post, QueryParam, Param, Authorized } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { EnrollmentsService } from "../services/EnrollmentsService";

@Service()
@JsonController("/v1")
export class GetEnrollmentsController {
  private enrollmentsService: EnrollmentsService;
  constructor() {
    this.enrollmentsService = Container.get(EnrollmentsService);
  }

  @Get("/enrollments")
  @Authorized()
  async handle(
    @QueryParam("student_id") student_id?: string,
    @QueryParam("schedule_id") schedule_id?: string,
    @QueryParam("is_active") is_active?: boolean,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number
  ) {
    return await this.enrollmentsService.index({ student_id, schedule_id, is_active, page, limit });
  }
}

@Service()
@JsonController("/v1")
export class PostEnrollmentsController {
  private enrollmentsService: EnrollmentsService;
  constructor() {
    this.enrollmentsService = Container.get(EnrollmentsService);
  }

  @Post("/enrollments")
  @Authorized(["administrator"])
  async handle(@Body() body: any) {
    return await this.enrollmentsService.create(body);
  }
}

@Service()
@JsonController("/v1")
export class PatchEnrollmentController {
  private enrollmentsService: EnrollmentsService;
  constructor() {
    this.enrollmentsService = Container.get(EnrollmentsService);
  }

  @Patch("/enrollments/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.enrollmentsService.update(id, body);
  }
}
