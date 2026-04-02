import {
  Body,
  Get,
  JsonController,
  Param,
  Post,
  QueryParam,
  Authorized,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import {
  SchedulesService,
  type ListSchedulesQuery,
  type AvailableSchedulesQuery,
  type ConflictCheckInput,
} from "../services/SchedulesService";

@Service()
@JsonController("/v1/schedules")
export class SchedulesController {
  private schedulesService: SchedulesService;
  constructor() {
    this.schedulesService = Container.get(SchedulesService);
  }

  @Get("/")
  @Authorized()
  async index(
    @QueryParam("teacher_id") teacher_id?: string,
    @QueryParam("site_id") site_id?: string,
    @QueryParam("is_active") is_active?: boolean,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    const query: ListSchedulesQuery = { teacher_id, site_id, is_active, page, limit };
    return await this.schedulesService.index(query);
  }

  @Get("/available")
  @Authorized(["parent", "administrator"])
  async available(
    @QueryParam("site_id") site_id?: string,
    @QueryParam("day_of_week_mask") day_of_week_mask?: number,
    @QueryParam("day_pattern") day_pattern?: "mws" | "tths",
    @QueryParam("exclude_current_schedule_id") exclude_current_schedule_id?: string,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    const query: AvailableSchedulesQuery = {
      site_id,
      day_of_week_mask,
      day_pattern,
      exclude_current_schedule_id,
      page,
      limit,
    };
    return await this.schedulesService.getAvailable(query);
  }

  @Get("/:id")
  @Authorized()
  async show(@Param("id") id: string) {
    const schedule = await this.schedulesService.show(id);
    if (!schedule) {
      throw new Error("Schedule not found");
    }
    return schedule;
  }

  @Post("/conflicts/check")
  @Authorized(["administrator"])
  async checkConflicts(@Body() body: ConflictCheckInput) {
    return await this.schedulesService.checkConflicts(body);
  }
}
