import { Body, Get, JsonController, Post, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { SchedulesService } from "../services/SchedulesService";

@Service()
@JsonController("/v1/schedules")
export class SchedulesController {
  constructor(
    @Inject(() => SchedulesService)
    private readonly schedulesService: SchedulesService
  ) {}

  @Get("/")
  async index(@QueryParams() query: any) {
    return await this.schedulesService.index(query);
  }

  @Post("/conflicts/check")
  async checkConflicts(@Body() body: any) {
    return await this.schedulesService.checkConflicts(body);
  }
}




