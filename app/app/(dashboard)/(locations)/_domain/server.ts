import type { UserEntity } from "@/_platform/db/schema";

import { createLocation } from "../_create/service";
import { getLocation } from "../_detail/service";
import { updateLocation } from "../_edit/service";
import { listLocations } from "../_list/service";
import { mapSummary } from "../_map/service";
import { nowNext } from "../_now-next/service";
import { staffByLocation } from "../_staff/service";
import type { CreateLocationDto, ListLocationsQuery, UpdateLocationDto } from "./types";

export type {
  CreateLocationDto,
  UpdateLocationDto,
  LocationStaffMember,
  LocationStaffResponse,
  LocationMapPin,
  ListLocationsQuery,
} from "./types";
export { createLocation } from "../_create/actions";
export { updateLocation } from "../_edit/actions";

export class LocationsService {
  async index(query: ListLocationsQuery = {}) {
    return listLocations(query);
  }

  async show(siteId: string) {
    return getLocation(siteId);
  }

  async create(data: CreateLocationDto) {
    return createLocation(data);
  }

  async update(siteId: string, data: UpdateLocationDto) {
    return updateLocation(siteId, data);
  }

  async mapSummary() {
    return mapSummary();
  }

  async nowNext(siteId: string, query?: { date?: string }) {
    return nowNext(siteId, query);
  }

  async staffByLocation(siteId: string, currentUser: UserEntity) {
    return staffByLocation(siteId, currentUser);
  }
}

export const locationsService = new LocationsService();
