import { Body, Get, JsonController, Patch } from "routing-controllers";
import { Service, Inject } from "typedi";
import { MeService } from "../services/MeService";

@Service()
@JsonController("/v1")
export class GetMeController {
  constructor(
    @Inject(() => MeService)
    private readonly meService: MeService
  ) {}

  @Get("/me")
  async handle() {
    return await this.meService.getMe();
  }
}

@Service()
@JsonController("/v1")
export class PatchMeController {
  constructor(
    @Inject(() => MeService)
    private readonly meService: MeService
  ) {}

  @Patch("/me")
  async handle(@Body() body: any) {
    return await this.meService.updateMe(body);
  }
}


