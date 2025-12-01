import { Get, JsonController, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { TeachersService } from "../services/TeachersService";

@Service()
@JsonController("/v1")
export class GetTeachersMeDayController {
  constructor(
    @Inject(() => TeachersService)
    private readonly teachersService: TeachersService
  ) {}

  @Get("/teachers/me/day")
  async handle(@QueryParams() query: any) {
    return await this.teachersService.myDay(query);
  }
}


