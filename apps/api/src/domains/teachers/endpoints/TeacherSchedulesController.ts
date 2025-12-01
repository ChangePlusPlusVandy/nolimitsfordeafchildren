import { Body, JsonController, Param, Patch, Post } from "routing-controllers";
import { Service, Inject } from "typedi";
import { TeachersService } from "../services/TeachersService";

@Service()
@JsonController("/v1")
export class PostTeacherSchedulesController {
  constructor(
    @Inject(() => TeachersService)
    private readonly teachersService: TeachersService
  ) {}

  @Post("/teachers/:id/schedules")
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.teachersService.createSchedule(id, body);
  }
}

@Service()
@JsonController("/v1")
export class PatchSchedulesController {
  constructor(
    @Inject(() => TeachersService)
    private readonly teachersService: TeachersService
  ) {}

  @Patch("/schedules/:scheduleId")
  async handle(@Param("scheduleId") scheduleId: string, @Body() body: any) {
    return await this.teachersService.updateSchedule(scheduleId, body);
  }
}


