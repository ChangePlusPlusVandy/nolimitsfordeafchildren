import { acknowledgeBulletin as serverAcknowledgeBulletin } from "../_acknowledge/actions";
import {
  addBulletinAttachment as serverAddBulletinAttachment,
  deleteBulletinAttachment as serverDeleteBulletinAttachment,
  getBulletinAttachmentUploadUrl as serverGetBulletinAttachmentUploadUrl,
} from "../_attachments/actions";
import { createBulletin as serverCreateBulletin } from "../_create/actions";
import { deleteBulletin as serverDeleteBulletin } from "../_delete/actions";
import { updateBulletin as serverUpdateBulletin } from "../_edit/actions";
import { reviewBulletin as serverReviewBulletin } from "../_moderate/actions";
import {
  getBulletin as serverGetBulletin,
  getBulletinAcknowledgements as serverGetBulletinAcknowledgements,
  getBulletinViews as serverGetBulletinViews,
  listBulletins as serverListBulletins,
  listBulletinsPending as serverListBulletinsPending,
} from "./queries";
import type {
  Bulletin,
  BulletinAcknowledgementStats,
  BulletinViewStats,
  GetAttachmentUploadUrlInput,
  ListBulletinsParams,
  ListBulletinsResponse,
} from "./types";

export type * from "./types";

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

export async function createBulletin(payload: import("./types").CreateBulletinInput) {
  return serverCreateBulletin(payload);
}

export async function updateBulletin(
  payload: import("./types").UpdateBulletinInput & { id: string },
) {
  const { id, ...data } = payload;
  return serverUpdateBulletin(id, data);
}

export async function deleteBulletin(id: string): Promise<{ success: boolean; message: string }> {
  return serverDeleteBulletin(id) as never;
}

export async function addAttachment(
  bulletinId: string,
  payload: import("./types").AddAttachmentInput,
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
  payload: import("./types").AcknowledgeBulletinInput,
) {
  return serverAcknowledgeBulletin(bulletinId, payload);
}

export async function reviewBulletin(id: string, payload: import("./types").ReviewBulletinInput) {
  return serverReviewBulletin(id, payload);
}

export async function moderateBulletin(id: string, payload: import("./types").ReviewBulletinInput) {
  return serverReviewBulletin(id, payload);
}
