import { Body, JsonController, Param, Patch, Post } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { Authorized } from "routing-controllers";
import { TeachersService, type CreateScheduleInput, type UpdateScheduleInput } from "../services/TeachersService";

@Service()
@JsonController("/v1")
export class PostTeacherSchedulesController {
  private teachersService: TeachersService;
  constructor() {
    this.teachersService = Container.get(TeachersService);
  }

  @Post("/teachers/:id/schedules")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: CreateScheduleInput) {
    return await this.teachersService.createSchedule(id, body);
  }
}

@Service()
@JsonController("/v1")
export class PatchSchedulesController {
  private teachersService: TeachersService;
  constructor() {
    this.teachersService = Container.get(TeachersService);
  }

  @Patch("/schedules/:scheduleId")
  @Authorized(["administrator"])
  async handle(@Param("scheduleId") scheduleId: string, @Body() body: UpdateScheduleInput) {
    const schedule = await this.teachersService.updateSchedule(scheduleId, body);
    if (!schedule) {
      throw new Error("Schedule not found");
    }
    return schedule;
  }
}
