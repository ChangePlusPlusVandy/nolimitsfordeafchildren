import type { IHttpService } from "../../../utils/IHttpService"
import { useHttpClient } from "../../../plugins/axios"

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

export interface LocationMapPin {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  type: LocationType;
  is_active: boolean;
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

export function useLocationHttpService(): IHttpService & {
  queries: {
    index: () => Promise<Location[]>;
    show: (id: string) => Promise<Location>;
    mapData: () => Promise<LocationMapPin[]>;
  };
  mutations: {
    create: (payload: CreateLocationPayload) => Promise<Location>;
    update: (params: { id: string; payload: UpdateLocationPayload }) => Promise<Location>;
  };
} {
  const httpClient = useHttpClient()

  return {
    key: 'locations',
    mutations: {
      create: async (payload: CreateLocationPayload) => {
        const response = await httpClient.post<Location>(`/v1/locations`, payload)
        return response.data
      },
      update: async ({ id, payload }: { id: string; payload: UpdateLocationPayload }) => {
        const response = await httpClient.patch<Location>(`/v1/locations/${id}`, payload)
        return response.data
      },
    },
    queries: {
      index: async () => {
        const response = await httpClient.get<Location[]>(`/v1/locations`)
        return response.data
      },
      show: async (id: string) => {
        const response = await httpClient.get<Location>(`/v1/locations/${id}`)
        return response.data
      },
      mapData: async () => {
        const response = await httpClient.get<LocationMapPin[]>(`/v1/locations/map-summary`)
        return response.data
      },
    }
  }
}


