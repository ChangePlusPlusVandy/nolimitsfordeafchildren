import { type ListLocationsQuery, LocationsService } from "@/server/locations/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

/**
 * GET /v1/locations — public (no auth gate; the Express middleware ran but
 * never blocked public routes).
 */
export async function listLocations(query: ListLocationsQuery = {}) {
  return await new LocationsService().index(query);
}

/**
 * GET /v1/locations/map-summary — public.
 */
export async function mapSummary() {
  return await new LocationsService().mapSummary();
}

/**
 * GET /v1/locations/:siteId/now-next — public.
 */
export async function nowNext(siteId: string, query?: { date?: string }) {
  return await new LocationsService().nowNext(siteId, query);
}

/**
 * GET /v1/sites/:siteId/now-next — public (SitesController reuses
 * LocationsService.nowNext; the sites domain maps into src/server/locations/).
 */
export async function getSiteNowNext(siteId: string, query?: { date?: string }) {
  return await new LocationsService().nowNext(siteId, query);
}

/**
 * GET /v1/locations/:siteId — public.
 */
export async function showLocation(siteId: string) {
  const location = await new LocationsService().show(siteId);
  if (!location) {
    throw new NotFoundError("Location not found");
  }
  return location;
}

/**
 * Client-facing aliases (src/client/locations.ts imports these names).
 */
export async function getLocation(siteId: string) {
  return await showLocation(siteId);
}

export async function getLocationMap() {
  return await mapSummary();
}

/**
 * GET /v1/locations/:siteId/staff — parent | administrator.
 */
export async function staffByLocation(siteId: string) {
  const currentUser = await requireRole("parent", "administrator");
  return await new LocationsService().staffByLocation(siteId, currentUser);
}

/** Re-exported for callers that want the create/update DTO types. */
export type { CreateLocationDto } from "@/server/locations/service";
