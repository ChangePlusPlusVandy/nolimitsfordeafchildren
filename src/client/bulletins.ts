/**
 * Thin client data-access layer for Bulletins (board, moderation).
 *
 * Names reconcile 1:1 with `src/server/bulletins/{queries,actions}.ts`.
 */

import {
  acknowledgeBulletin as serverAcknowledgeBulletin,
  addBulletinAttachment as serverAddBulletinAttachment,
  createBulletin as serverCreateBulletin,
  deleteBulletin as serverDeleteBulletin,
  deleteBulletinAttachment as serverDeleteBulletinAttachment,
  getBulletinAttachmentUploadUrl as serverGetBulletinAttachmentUploadUrl,
  reviewBulletin as serverReviewBulletin,
  updateBulletin as serverUpdateBulletin,
} from "@/server/bulletins/actions";
import {
  getBulletin as serverGetBulletin,
  getBulletinAcknowledgements as serverGetBulletinAcknowledgements,
  getBulletinViews as serverGetBulletinViews,
  listBulletins as serverListBulletins,
  listBulletinsPending as serverListBulletinsPending,
} from "@/server/bulletins/queries";

export type {
  AcknowledgeBulletinInput,
  AddAttachmentInput,
  BulletinRoleTarget,
  BulletinScope,
  CreateBulletinInput,
  ListBulletinsQuery,
  ReviewBulletinInput,
  UpdateBulletinInput,
} from "@/server/bulletins/service";

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
  scope: import("@/server/bulletins/service").BulletinScope;
  role_target: import("@/server/bulletins/service").BulletinRoleTarget;
  requires_approval: boolean;
  approval_status: BulletinApprovalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  title: string;
  body: string | null;
  requires_initials: boolean;
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

export interface ListBulletinsParams {
  siteId?: string;
  scope?: import("@/server/bulletins/service").BulletinScope;
  roleTarget?: import("@/server/bulletins/service").BulletinRoleTarget;
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

export async function listBulletins(params?: ListBulletinsParams): Promise<ListBulletinsResponse> {
  return serverListBulletins(params as never) as never;
}

export async function getBulletinDetails(id: string): Promise<Bulletin> {
  return serverGetBulletin(id) as never;
}

export async function getViewStats(id: string): Promise<BulletinViewStats> {
  return serverGetBulletinViews(id) as never;
}

export async function getAcknowledgementStats(id: string): Promise<BulletinAcknowledgementStats> {
  return serverGetBulletinAcknowledgements(id) as never;
}

export async function getModerationPending(params?: {
  page?: number;
  limit?: number;
}): Promise<ListBulletinsResponse> {
  return serverListBulletinsPending(params) as never;
}

export async function createBulletin(
  payload: import("@/server/bulletins/service").CreateBulletinInput,
) {
  return serverCreateBulletin(payload);
}

export async function updateBulletin(
  payload: import("@/server/bulletins/service").UpdateBulletinInput & { id: string },
) {
  const { id, ...data } = payload;
  return serverUpdateBulletin(id, data);
}

export async function deleteBulletin(id: string): Promise<{ success: boolean; message: string }> {
  return serverDeleteBulletin(id) as never;
}

export async function addAttachment(
  bulletinId: string,
  payload: import("@/server/bulletins/service").AddAttachmentInput,
) {
  return serverAddBulletinAttachment(bulletinId, payload);
}

export async function getAttachmentUploadUrl(
  payload: GetAttachmentUploadUrlInput,
): Promise<{ upload_url: string; file_key: string; file_url: string }> {
  return serverGetBulletinAttachmentUploadUrl(payload) as never;
}

export async function deleteAttachment(
  bulletinId: string,
  attachmentId: string,
): Promise<{ success: boolean; message: string }> {
  return serverDeleteBulletinAttachment(bulletinId, attachmentId) as never;
}

export async function acknowledgeBulletin(
  bulletinId: string,
  payload: import("@/server/bulletins/service").AcknowledgeBulletinInput,
) {
  return serverAcknowledgeBulletin(bulletinId, payload);
}

export async function reviewBulletin(
  id: string,
  payload: import("@/server/bulletins/service").ReviewBulletinInput,
) {
  return serverReviewBulletin(id, payload);
}

/** Alias kept for parity with the legacy service. */
export async function moderateBulletin(
  id: string,
  payload: import("@/server/bulletins/service").ReviewBulletinInput,
) {
  return serverReviewBulletin(id, payload);
}
