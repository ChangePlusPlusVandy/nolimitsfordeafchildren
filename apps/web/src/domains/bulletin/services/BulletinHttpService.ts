import { useHttpClient } from "../../../plugins/axios";

export type BulletinScope = "global" | "site";
export type BulletinRoleTarget = "all" | "administrator" | "teacher" | "parent";
export type BulletinApprovalStatus = "draft" | "pending" | "approved" | "rejected";

export interface BulletinAttachment {
  id: string;
  bulletin_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface Bulletin {
  id: string;
  site_id: string | null;
  scope: BulletinScope;
  role_target: BulletinRoleTarget;
  requires_approval: boolean;
  approval_status: BulletinApprovalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  title: string;
  body: string | null;
  publish_at: string | null;
  expire_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  attachments: BulletinAttachment[];
  created_by_name?: string;
  site_name?: string;
  view_count?: number;
  acknowledgement_count?: number;
  acknowledged?: boolean;
  acknowledged_at?: string | null;
  acknowledged_initials?: string | null;
}

export interface BulletinView {
  id: string;
  bulletin_id: string;
  user_id: string;
  viewed_at: string;
  last_viewed_at: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  };
}

export interface BulletinViewStats {
  count: number;
  viewers: BulletinView[];
}

export interface BulletinAcknowledgement {
  id: string;
  bulletin_id: string;
  user_id: string;
  initials: string;
  acknowledged_at: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  };
}

export interface BulletinAcknowledgementStats {
  count: number;
  acknowledgements: BulletinAcknowledgement[];
}

export interface GetAttachmentUploadUrlInput {
  file_name: string;
  content_type: string;
}

export interface AcknowledgeBulletinInput {
  initials: string;
}

export interface ListBulletinsParams {
  siteId?: string;
  scope?: BulletinScope;
  roleTarget?: BulletinRoleTarget;
  includeExpired?: boolean;
  includeScheduled?: boolean;
  page?: number;
  limit?: number;
}

export interface ListBulletinsResponse {
  items: Bulletin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBulletinInput {
  title: string;
  body?: string;
  scope: BulletinScope;
  site_id?: string | null;
  role_target: BulletinRoleTarget;
  requires_approval?: boolean;
  publish_at?: string | null;
  expire_at?: string | null;
}

export interface UpdateBulletinInput {
  title?: string;
  body?: string;
  scope?: BulletinScope;
  site_id?: string | null;
  role_target?: BulletinRoleTarget;
  requires_approval?: boolean;
  approval_status?: BulletinApprovalStatus;
  review_notes?: string | null;
  publish_at?: string | null;
  expire_at?: string | null;
}

export interface ReviewBulletinInput {
  status: "approved" | "rejected";
  notes?: string;
}

export interface AddAttachmentInput {
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export function useBulletinHttpService() {
  const httpClient = useHttpClient();

  return {
    key: "bulletins",

    queries: {
      /**
       * List bulletins with filtering
       */
      index: async (params?: ListBulletinsParams): Promise<ListBulletinsResponse> => {
        const response = await httpClient.get("/v1/bulletins", { params });
        return response.data;
      },

      /**
       * Get a single bulletin by ID
       */
      show: async (id: string): Promise<Bulletin> => {
        const response = await httpClient.get(`/v1/bulletins/${id}`);
        return response.data;
      },

      viewStats: async (id: string): Promise<BulletinViewStats> => {
        const response = await httpClient.get(`/v1/bulletins/${id}/views`);
        return response.data;
      },

      acknowledgementStats: async (id: string): Promise<BulletinAcknowledgementStats> => {
        const response = await httpClient.get(`/v1/bulletins/${id}/acknowledgements`);
        return response.data;
      },

      pending: async (): Promise<{ items: Bulletin[] }> => {
        const response = await httpClient.get(`/v1/bulletins/moderation/pending`);
        return response.data;
      },

      moderationList: async (): Promise<{ items: Bulletin[] }> => {
        const response = await httpClient.get(`/v1/bulletins/moderation/pending`);
        return response.data;
      },
    },

    mutations: {
      /**
       * Create a new bulletin
       */
      create: async (payload: CreateBulletinInput): Promise<Bulletin> => {
        const response = await httpClient.post("/v1/bulletins", payload);
        return response.data;
      },

      /**
       * Update a bulletin
       */
      update: async ({ id, ...data }: UpdateBulletinInput & { id: string }): Promise<Bulletin> => {
        const response = await httpClient.patch(`/v1/bulletins/${id}`, data);
        return response.data;
      },

      /**
       * Delete a bulletin
       */
      delete: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await httpClient.delete(`/v1/bulletins/${id}`);
        return response.data;
      },

      /**
       * Add an attachment to a bulletin
       */
      addAttachment: async (
        bulletinId: string,
        payload: AddAttachmentInput,
      ): Promise<BulletinAttachment> => {
        const response = await httpClient.post(`/v1/bulletins/${bulletinId}/attachments`, payload);
        return response.data;
      },

      getAttachmentUploadUrl: async (
        payload: GetAttachmentUploadUrlInput,
      ): Promise<{ upload_url: string; file_key: string; file_url: string }> => {
        const response = await httpClient.post(`/v1/bulletins/attachments/upload-url`, payload);
        return response.data;
      },

      /**
       * Delete an attachment from a bulletin
       */
      deleteAttachment: async (
        bulletinId: string,
        attachmentId: string,
      ): Promise<{ success: boolean; message: string }> => {
        const response = await httpClient.delete(
          `/v1/bulletins/${bulletinId}/attachments/${attachmentId}`,
        );
        return response.data;
      },

      acknowledge: async (
        bulletinId: string,
        payload: AcknowledgeBulletinInput,
      ): Promise<BulletinAcknowledgement> => {
        const response = await httpClient.post(`/v1/bulletins/${bulletinId}/acknowledge`, payload);
        return response.data;
      },

      review: async (id: string, payload: ReviewBulletinInput): Promise<Bulletin> => {
        const response = await httpClient.patch(`/v1/bulletins/${id}/review`, payload);
        return response.data;
      },

      moderate: async (id: string, payload: ReviewBulletinInput): Promise<Bulletin> => {
        const response = await httpClient.patch(`/v1/bulletins/${id}/review`, payload);
        return response.data;
      },
    },
  };
}
