import {
  Body,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParam,
  Authorized,
  HttpCode,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { LocationsService } from "../services/LocationsService";
import type { CreateLocationDto, UpdateLocationDto } from "../services/LocationsService";

/**
 * Consolidated Locations Controller
 *
 * IMPORTANT: Route order matters! Static routes must come before parameterized routes.
 * Within a single controller class, routing-controllers respects method order.
 */
@Service()
@JsonController("/v1/locations")
export class LocationsController {
  private locationsService: LocationsService;

  constructor() {
    this.locationsService = Container.get(LocationsService);
  }

  /**
   * GET /v1/locations
   * List all locations with optional filtering
   */
  @Get()
  async index(@QueryParam("is_active") is_active?: boolean) {
    return await this.locationsService.index({ is_active });
  }

  /**
   * POST /v1/locations
   * Create a new location (Admin only)
   */
  @Post()
  @Authorized(["administrator"])
  @HttpCode(201)
  async create(@Body() body: CreateLocationDto) {
    return await this.locationsService.create(body);
  }

  /**
   * GET /v1/locations/map-summary
   * Returns minimal data optimized for map pins
   * MUST be defined before /:siteId route!
   */
  @Get("/map-summary")
  async mapSummary() {
    return await this.locationsService.mapSummary();
  }

  /**
   * GET /v1/locations/:siteId/now-next
   * Returns current and upcoming sessions at a location
   */
  @Get("/:siteId/now-next")
  async nowNext(@Param("siteId") siteId: string, @QueryParam("date") date?: string) {
    return await this.locationsService.nowNext(siteId, { date });
  }

  /**
   * GET /v1/locations/:siteId
   * Get a single location by ID
   */
  @Get("/:siteId")
  async show(@Param("siteId") siteId: string) {
    const location = await this.locationsService.show(siteId);
    if (!location) {
      throw new Error("Location not found");
    }
    return location;
  }

  /**
   * PATCH /v1/locations/:siteId
   * Update an existing location (Admin only)
   */
  @Patch("/:siteId")
  @Authorized(["administrator"])
  async update(@Param("siteId") siteId: string, @Body() body: UpdateLocationDto) {
    const location = await this.locationsService.update(siteId, body);
    if (!location) {
      throw new Error("Location not found");
    }
    return location;
  }
}

// Keep old class names as aliases for backwards compatibility with imports
export const GetLocationsController = LocationsController;
export const PostLocationsController = LocationsController;
export const GetLocationController = LocationsController;
export const PatchLocationController = LocationsController;
