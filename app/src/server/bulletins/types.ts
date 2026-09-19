import type {
  BulletinAcknowledgementEntity,
  BulletinAttachmentEntity,
  BulletinEntity,
  BulletinViewEntity,
} from "@/db/schema";

export type BulletinScope = "global" | "site";
export type BulletinRoleTarget = "all" | "administrator" | "teacher" | "parent";
export type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

export interface ListBulletinsQuery {
  siteId?: string;
  scope?: BulletinScope;
  roleTarget?: BulletinRoleTarget;
  includeExpired?: boolean;
  includeScheduled?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateBulletinInput {
  title: string;
  body?: string;
  scope: BulletinScope;
  site_id?: string | null;
  role_target: BulletinRoleTarget;
  requires_approval?: boolean;
  requires_initials?: boolean;
  publish_at?: Date | string | null;
  expire_at?: Date | string | null;
}

export interface UpdateBulletinInput {
  title?: string;
  body?: string;
  scope?: BulletinScope;
  site_id?: string | null;
  role_target?: BulletinRoleTarget;
  requires_approval?: boolean;
  requires_initials?: boolean;
  approval_status?: "draft" | "pending" | "approved" | "rejected";
  reviewed_by?: string | null;
  reviewed_at?: Date | string | null;
  review_notes?: string | null;
  publish_at?: Date | string | null;
  expire_at?: Date | string | null;
}

export interface AddAttachmentInput {
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export interface BulletinWithDetails extends BulletinEntity {
  attachments: BulletinAttachmentEntity[];
  created_by_name?: string;
  site_name?: string;
  view_count?: number;
  acknowledgement_count?: number;
  acknowledged?: boolean;
  acknowledged_at?: Date | null;
  acknowledged_initials?: string | null;
}

export interface BulletinViewWithUser extends BulletinViewEntity {
  user: {
    id: string;
    name: string;
    email: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  };
}

export interface BulletinAcknowledgementWithUser extends BulletinAcknowledgementEntity {
  user: {
    id: string;
    name: string;
    email: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  };
}

export interface GetBulletinAttachmentUploadUrlInput {
  file_name: string;
  content_type: string;
}

export interface AcknowledgeBulletinInput {
  initials: string;
}

export interface ReviewBulletinInput {
  status: "approved" | "rejected";
  notes?: string;
}
