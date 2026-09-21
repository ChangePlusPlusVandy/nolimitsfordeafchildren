import type {
  BulletinAcknowledgementEntity,
  BulletinAttachmentEntity,
  BulletinEntity,
} from "@/db/schema";
import {
  acknowledgeBulletin,
  getBulletinAcknowledgementStats,
} from "@/server/bulletins/acknowledgements";
import {
  addBulletinAttachment,
  deleteBulletinAttachment,
  getBulletinAttachmentUploadUrl,
} from "@/server/bulletins/attachments";
import {
  createBulletin,
  deleteBulletin,
  listPendingApprovalBulletins,
  reviewBulletin,
  updateBulletin,
} from "@/server/bulletins/crud";
import { listBulletins, showBulletin } from "@/server/bulletins/listing";
import type { BulletinWithDetails, ListBulletinsQuery, UserRole } from "@/server/bulletins/types";
import { getBulletinViewStats, recordBulletinView } from "@/server/bulletins/views";
import type { PaginatedResponse } from "@/server/shared/pagination";

export type {
  AcknowledgeBulletinInput,
  AddAttachmentInput,
  BulletinAcknowledgementWithUser,
  BulletinRoleTarget,
  BulletinScope,
  BulletinViewWithUser,
  BulletinWithDetails,
  CreateBulletinInput,
  GetBulletinAttachmentUploadUrlInput,
  ListBulletinsQuery,
  ReviewBulletinInput,
  UpdateBulletinInput,
  UserRole,
} from "@/server/bulletins/types";

export class BulletinsService {
  recordView(bulletinId: string, userId: string) {
    return recordBulletinView(bulletinId, userId);
  }

  getViewStats(bulletinId: string) {
    return getBulletinViewStats(bulletinId);
  }

  getAcknowledgementStats(bulletinId: string) {
    return getBulletinAcknowledgementStats(bulletinId);
  }

  index(query: ListBulletinsQuery, userRole: UserRole, userId: string) {
    return listBulletins(query, userRole, userId);
  }

  show(id: string, userId?: string) {
    return showBulletin(id, userId);
  }

  create(
    data: Parameters<typeof createBulletin>[0],
    userId: string,
    userRole: UserRole,
  ): Promise<BulletinEntity> {
    return createBulletin(data, userId, userRole);
  }

  update(id: string, data: Parameters<typeof updateBulletin>[1]) {
    return updateBulletin(id, data);
  }

  delete(id: string) {
    return deleteBulletin(id);
  }

  addAttachment(
    bulletinId: string,
    data: Parameters<typeof addBulletinAttachment>[1],
  ): Promise<BulletinAttachmentEntity> {
    return addBulletinAttachment(bulletinId, data);
  }

  getAttachmentUploadUrl(input: Parameters<typeof getBulletinAttachmentUploadUrl>[0]) {
    return getBulletinAttachmentUploadUrl(input);
  }

  acknowledgeBulletin(
    bulletinId: string,
    userId: string,
    input: Parameters<typeof acknowledgeBulletin>[2],
  ): Promise<BulletinAcknowledgementEntity> {
    return acknowledgeBulletin(bulletinId, userId, input);
  }

  deleteAttachment(attachmentId: string) {
    return deleteBulletinAttachment(attachmentId);
  }

  listPendingApproval(
    query: Parameters<typeof listPendingApprovalBulletins>[0] = {},
  ): Promise<PaginatedResponse<BulletinWithDetails>> {
    return listPendingApprovalBulletins(query);
  }

  reviewBulletin(
    bulletinId: string,
    reviewerUserId: string,
    input: Parameters<typeof reviewBulletin>[2],
  ) {
    return reviewBulletin(bulletinId, reviewerUserId, input);
  }
}

export const bulletinsService = new BulletinsService();
