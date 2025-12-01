import { Get, JsonController, Param, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { LocationsService } from "../services/LocationsService";

@Service()
@JsonController("/v1")
export class GetLocationsSummaryMapController {
  constructor(
    @Inject(() => LocationsService)
    private readonly locationsService: LocationsService
  ) {}

  @Get("/locations/summary/map")
  async handle() {
    return await this.locationsService.mapSummary();
  }
}

@Service()
@JsonController("/v1")
export class GetLocationNowNextController {
  constructor(
    @Inject(() => LocationsService)
    private readonly locationsService: LocationsService
  ) {}

  @Get("/locations/:siteId/now-next")
  async handle(@Param("siteId") siteId: string, @QueryParams() query: any) {
    return await this.locationsService.nowNext(siteId, query);
  }
}


