import { Get, JsonController, Param, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { LocationsService } from "../../locations/services/LocationsService";

@Service()
@JsonController("/v1/sites")
export class SitesController {
  constructor(
    @Inject(() => LocationsService)
    private readonly locationsService: LocationsService
  ) {}

  @Get("/:siteId/now-next")
  async nowNext(@Param("siteId") siteId: string, @QueryParams() query: any) {
    return await this.locationsService.nowNext(siteId, query);
  }
}




