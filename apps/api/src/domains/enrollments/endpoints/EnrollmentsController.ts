import { Body, Get, JsonController, Patch, Post, QueryParams, Param, Authorized } from "routing-controllers";
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
  async handle(@QueryParams() query: any) {
    return await this.enrollmentsService.index(query);
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
