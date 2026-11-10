import type { ListLocationsParams, Location, PaginatedLocationsResponse } from "../_domain/types";
import { listLocations as serverListLocations } from "./queries";

export async function listAllLocations(): Promise<Location[]> {
  const result = await serverListLocations({ page: 1, limit: 500, sort: "name", order: "asc" });
  return result.items as never;
}

export async function listLocations(
  params?: ListLocationsParams,
): Promise<PaginatedLocationsResponse> {
  return serverListLocations(params as never) as never;
}
