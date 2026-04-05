import {
  Body,
  CurrentUser,
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
import type {
  CreateLocationDto,
  UpdateLocationDto,
  ListLocationsQuery,
} from "../services/LocationsService";

type CurrentUserLike =
  | {
      id: string;
      role: "administrator" | "teacher" | "parent" | "unassigned";
    }
  | null
  | undefined;

/**
 * Consolidated Locations Controller
 *
 * IMPORTANT: Route order matters! Static routes must come before parameterized routes.
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
  async index(
    @QueryParam("search") search?: string,
    @QueryParam("type") type?: "education_center" | "pop_up" | "remote",
    @QueryParam("is_active") is_active?: boolean,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
    @QueryParam("sort") sort?: "name" | "created_at",
    @QueryParam("order") order?: "asc" | "desc",
  ) {
    const query: ListLocationsQuery = {
      search,
      type,
      is_active,
      page,
      limit,
      sort,
      order,
    };
    return await this.locationsService.index(query);
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
   * GET /v1/locations/:siteId/staff
   * Parent-facing staff list for a location
   */
  @Get("/:siteId/staff")
  @Authorized(["parent", "administrator"])
  async staff(
    @Param("siteId") siteId: string,
    @CurrentUser() currentUser?: CurrentUserLike,
  ) {
    return await this.locationsService.staffByLocation(siteId, currentUser);
  }

  /**
   * GET /v1/locations/:siteId/now-next
   * Returns current and upcoming sessions at a location
   */
  @Get("/:siteId/now-next")
  async nowNext(
    @Param("siteId") siteId: string,
    @QueryParam("date") date?: string,
  ) {
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
  async update(
    @Param("siteId") siteId: string,
    @Body() body: UpdateLocationDto,
  ) {
    const location = await this.locationsService.update(siteId, body);
    if (!location) {
      throw new Error("Location not found");
    }
    return location;
  }
}

export const GetLocationsController = LocationsController;
export const PostLocationsController = LocationsController;
export const GetLocationController = LocationsController;
export const PatchLocationController = LocationsController;
