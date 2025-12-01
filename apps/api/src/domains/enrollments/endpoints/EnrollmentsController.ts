import { Body, Get, JsonController, Patch, Post, QueryParams, Param } from "routing-controllers";
import { Service, Inject } from "typedi";
import { EnrollmentsService } from "../services/EnrollmentsService";

@Service()
@JsonController("/v1")
export class GetEnrollmentsController {
  constructor(
    @Inject(() => EnrollmentsService)
    private readonly enrollmentsService: EnrollmentsService
  ) {}

  @Get("/enrollments")
  async handle(@QueryParams() query: any) {
    return await this.enrollmentsService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class PostEnrollmentsController {
  constructor(
    @Inject(() => EnrollmentsService)
    private readonly enrollmentsService: EnrollmentsService
  ) {}

  @Post("/enrollments")
  async handle(@Body() body: any) {
    return await this.enrollmentsService.create(body);
  }
}

@Service()
@JsonController("/v1")
export class PatchEnrollmentController {
  constructor(
    @Inject(() => EnrollmentsService)
    private readonly enrollmentsService: EnrollmentsService
  ) {}

  @Patch("/enrollments/:id")
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.enrollmentsService.update(id, body);
  }
}


