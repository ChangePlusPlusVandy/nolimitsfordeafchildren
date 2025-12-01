import { Body, Get, JsonController, Param, Patch, Post, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { LocationsService } from "../services/LocationsService";

@Service()
@JsonController("/v1")
export class GetLocationsController {
  constructor(
    @Inject(() => LocationsService)
    private readonly locationsService: LocationsService
  ) {}

  @Get("/locations")
  async handle(@QueryParams() query: any) {
    return await this.locationsService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class PostLocationsController {
  constructor(
    @Inject(() => LocationsService)
    private readonly locationsService: LocationsService
  ) {}

  @Post("/locations")
  async handle(@Body() body: any) {
    return await this.locationsService.create(body);
  }
}

@Service()
@JsonController("/v1")
export class GetLocationController {
  constructor(
    @Inject(() => LocationsService)
    private readonly locationsService: LocationsService
  ) {}

  @Get("/locations/:siteId")
  async handle(@Param("siteId") siteId: string) {
    return await this.locationsService.show(siteId);
  }
}

@Service()
@JsonController("/v1")
export class PatchLocationController {
  constructor(
    @Inject(() => LocationsService)
    private readonly locationsService: LocationsService
  ) {}

  @Patch("/locations/:siteId")
  async handle(@Param("siteId") siteId: string, @Body() body: any) {
    return await this.locationsService.update(siteId, body);
  }
}


