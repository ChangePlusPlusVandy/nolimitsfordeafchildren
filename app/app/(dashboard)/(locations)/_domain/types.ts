import type { LocationInsert } from "@/_platform/db/schema";

export type CreateLocationDto = Omit<LocationInsert, "id" | "created_at" | "updated_at">;
export type UpdateLocationDto = Partial<CreateLocationDto>;

export interface LocationStaffMember {
  id: string;
  name: string;
  role: "administrator" | "teacher";
  email: string;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
}

export interface LocationStaffResponse {
  location_id: string;
  location_name: string;
  staff: LocationStaffMember[];
}

export type LocationMapPin = {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  type: "education_center" | "pop_up" | "remote";
  is_active: boolean;
};

export interface SiteMapPin {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  type: "education_center" | "pop_up" | "remote";
  is_active: boolean;
}

export interface ListLocationsQuery {
  search?: string;
  type?: "education_center" | "pop_up" | "remote";
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "created_at";
  order?: "asc" | "desc";
}

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
