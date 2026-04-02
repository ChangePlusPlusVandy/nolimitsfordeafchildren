import { useHttpClient } from "../../../plugins/axios";

export type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

export interface User {
  id: string;
  authUserId: string | null;
  email: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  locale: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListUsersParams {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "email" | "created_at";
  order?: "asc" | "desc";
}

export interface ListUsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InviteUserInput {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  primary_site_id?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  locale?: string;
  role?: UserRole;
  is_active?: boolean;
}

export function useUserHttpService() {
  const httpClient = useHttpClient();

  return {
    key: "users",

    queries: {
      /**
       * List users with filtering and pagination
       */
      index: async (params?: ListUsersParams): Promise<ListUsersResponse> => {
        const response = await httpClient.get("/v1/users", { params });
        return response.data;
      },

      /**
       * Get a single user by ID
       */
      show: async (id: string): Promise<User> => {
        const response = await httpClient.get(`/v1/users/${id}`);
        return response.data;
      },
    },

    mutations: {
      /**
       * Invite a new user
       */
      invite: async (payload: InviteUserInput): Promise<User> => {
        const response = await httpClient.post("/v1/users/invite", payload);
        return response.data;
      },

      /**
       * Update a user
       */
      update: async ({ id, ...data }: UpdateUserInput & { id: string }): Promise<User> => {
        const response = await httpClient.patch(`/v1/users/${id}`, data);
        return response.data;
      },

      /**
       * Disable (soft delete) a user
       */
      disable: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await httpClient.delete(`/v1/users/${id}`);
        return response.data;
      },

      /**
       * Re-enable a disabled user
       */
      enable: async (id: string): Promise<User> => {
        const response = await httpClient.post(`/v1/users/${id}/enable`);
        return response.data;
      },
    },
  };
}
