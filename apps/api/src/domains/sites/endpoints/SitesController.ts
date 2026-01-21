import { Get, JsonController, Param, QueryParams } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { LocationsService } from "../../locations/services/LocationsService";

@Service()
@JsonController("/v1/sites")
export class SitesController {
  private locationsService: LocationsService;
  constructor() {
    this.locationsService = Container.get(LocationsService);
  }

  @Get("/:siteId/now-next")
  async nowNext(@Param("siteId") siteId: string, @QueryParams() query: any) {
    return await this.locationsService.nowNext(siteId, query);
  }
}




