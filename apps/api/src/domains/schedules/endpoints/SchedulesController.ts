import { Body, Get, JsonController, Param, Post, QueryParams, Authorized } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { 
  SchedulesService, 
  type ListSchedulesQuery, 
  type AvailableSchedulesQuery,
  type ConflictCheckInput 
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
  async index(@QueryParams() query: ListSchedulesQuery) {
    return await this.schedulesService.index(query);
  }

  @Get("/available")
  @Authorized(["parent", "administrator"])
  async available(@QueryParams() query: AvailableSchedulesQuery) {
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
