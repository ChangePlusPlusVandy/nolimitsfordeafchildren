/**
 * Thin client data-access layer for Locations.
 *
 * Every function delegates to the server-side queries/actions ("use server")
 * so mutations run with server auth. Names reconcile 1:1 with
 * `src/server/locations/{queries,actions}.ts`.
 */

import {
  createLocation as serverCreateLocation,
  updateLocation as serverUpdateLocation,
} from "@/server/locations/actions";
import {
  listLocations as serverListLocations,
  mapSummary as serverMapSummary,
  showLocation as serverShowLocation,
  staffByLocation as serverStaffByLocation,
} from "@/server/locations/queries";

export type { ListLocationsQuery, LocationMapPin } from "@/server/locations/service";

export type LocationType = "education_center" | "pop_up" | "remote";

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  timezone: string;
  zoom_link: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListLocationsParams {
  search?: string;
  type?: LocationType;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "created_at";
  order?: "asc" | "desc";
}

export interface PaginatedLocationsResponse {
  items: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLocationPayload {
  name: string;
  type: LocationType;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  latitude?: string | null;
  longitude?: string | null;
  timezone: string;
  zoom_link?: string | null;
  is_active?: boolean;
}

export interface UpdateLocationPayload extends Partial<CreateLocationPayload> {}

/** All locations (unpaginated helper, sorted by name). */
export async function listAllLocations(): Promise<Location[]> {
  const result = await serverListLocations({
    page: 1,
    limit: 500,
    sort: "name",
    order: "asc",
  });
  return result.items as never;
}

/** Paginated location list with filters. */
export async function listLocations(
  params?: ListLocationsParams,
): Promise<PaginatedLocationsResponse> {
  return serverListLocations(params as never) as never;
}

export async function getLocation(id: string): Promise<Location | null> {
  return serverShowLocation(id) as never;
}

/** Map pins for the site-map page (client-rendered Leaflet map). */
export async function getMapData() {
  return serverMapSummary();
}

/** Staff directory for a location (parent directory feature). */
export async function getLocationStaff(siteId: string) {
  return serverStaffByLocation(siteId);
}

export async function createLocation(payload: CreateLocationPayload): Promise<Location> {
  return serverCreateLocation(payload as never) as never;
}

export async function updateLocation({
  id,
  payload,
}: {
  id: string;
  payload: UpdateLocationPayload;
}): Promise<Location> {
  return serverUpdateLocation(id, payload as never) as never;
}
