import { Body, Get, JsonController, Param, Patch, Post, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { AttendanceService } from "../services/AttendanceService";

@Service()
@JsonController("/v1")
export class PostAttendanceController {
  constructor(
    @Inject(() => AttendanceService)
    private readonly attendanceService: AttendanceService
  ) {}

  @Post("/attendance")
  async handle(@Body() body: any) {
    return await this.attendanceService.create(body);
  }
}

@Service()
@JsonController("/v1")
export class PatchAttendanceController {
  constructor(
    @Inject(() => AttendanceService)
    private readonly attendanceService: AttendanceService
  ) {}

  @Patch("/attendance/:id")
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.attendanceService.update(id, body);
  }
}

@Service()
@JsonController("/v1")
export class GetAttendanceController {
  constructor(
    @Inject(() => AttendanceService)
    private readonly attendanceService: AttendanceService
  ) {}

  @Get("/attendance")
  async handle(@QueryParams() query: any) {
    return await this.attendanceService.index(query);
  }
}


