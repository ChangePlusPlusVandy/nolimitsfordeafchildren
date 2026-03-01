import { Get, JsonController, Param, QueryParam } from "routing-controllers";
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
  async nowNext(@Param("siteId") siteId: string, @QueryParam("date") date?: string) {
    return await this.locationsService.nowNext(siteId, { date });
  }
}
