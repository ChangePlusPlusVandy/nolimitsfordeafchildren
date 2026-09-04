"use server";

import { z } from "zod";
import {
  type AcknowledgeBulletinInput,
  type AddAttachmentInput,
  BulletinsService,
  type CreateBulletinInput,
  type ReviewBulletinInput,
  type UpdateBulletinInput,
} from "@/server/bulletins/service";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";

const bulletinScopeSchema = z.enum(["global", "site"]);
const bulletinRoleTargetSchema = z.enum(["all", "administrator", "teacher", "parent"]);

const createBulletinSchema = z
  .object({
    title: z.string().min(1).max(300),
    body: z.string().max(10000).optional(),
    scope: bulletinScopeSchema,
    site_id: z.string().nullable().optional(),
    role_target: bulletinRoleTargetSchema,
    requires_approval: z.boolean().optional(),
    requires_initials: z.boolean().optional(),
    publish_at: z.union([z.string(), z.date()]).nullable().optional(),
    expire_at: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .passthrough();

const updateBulletinSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    body: z.string().max(10000).optional(),
    scope: bulletinScopeSchema.optional(),
    site_id: z.string().nullable().optional(),
    role_target: bulletinRoleTargetSchema.optional(),
    requires_approval: z.boolean().optional(),
    requires_initials: z.boolean().optional(),
    approval_status: z.enum(["draft", "pending", "approved", "rejected"]).optional(),
    reviewed_by: z.string().nullable().optional(),
    reviewed_at: z.union([z.string(), z.date()]).nullable().optional(),
    review_notes: z.string().max(2000).nullable().optional(),
    publish_at: z.union([z.string(), z.date()]).nullable().optional(),
    expire_at: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .passthrough();

const addAttachmentSchema = z
  .object({
    file_url: z.string().min(1).max(500),
    file_name: z.string().min(1).max(255),
    file_size: z.number().int().nonnegative().optional(),
    mime_type: z.string().max(200).optional(),
  })
  .passthrough();

const attachmentUploadUrlSchema = z
  .object({
    file_name: z.string().min(1).max(255),
    content_type: z.string().min(1).max(200),
  })
  .passthrough();

const acknowledgeSchema = z
  .object({
    initials: z.string().min(1).max(8),
  })
  .passthrough();

const reviewBulletinSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    notes: z.string().max(2000).optional(),
  })
  .passthrough();

/**
 * POST /v1/bulletins — create a bulletin (administrator | teacher).
 */
export async function createBulletin(input: CreateBulletinInput) {
  const currentUser = await requireRole("administrator", "teacher");

  if (!input.title || !input.title.trim()) {
    throw new BadRequestError("Title is required");
  }
  if (!input.scope || !["global", "site"].includes(input.scope)) {
    throw new BadRequestError("Scope must be 'global' or 'site'");
  }
  if (input.scope === "site" && !input.site_id) {
    throw new BadRequestError("site_id is required when scope is 'site'");
  }
  if (
    !input.role_target ||
    !["all", "administrator", "teacher", "parent"].includes(input.role_target)
  ) {
    throw new BadRequestError("role_target must be 'all', 'administrator', 'teacher', or 'parent'");
  }

  const parsed = createBulletinSchema.parse(input) as CreateBulletinInput;

  try {
    return await new BulletinsService().create(parsed, currentUser.id, currentUser.role);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("assigned site")) throw new BadRequestError(error.message);
      if (error.message.includes("requires_initials")) throw new BadRequestError(error.message);
    }
    throw error;
  }
}

/**
 * PATCH /v1/bulletins/:id — update (admin only).
 */
export async function updateBulletin(id: string, input: UpdateBulletinInput) {
  await requireRole("administrator");

  if (input.scope && !["global", "site"].includes(input.scope)) {
    throw new BadRequestError("Scope must be 'global' or 'site'");
  }
  if (
    input.role_target &&
    !["all", "administrator", "teacher", "parent"].includes(input.role_target)
  ) {
    throw new BadRequestError("role_target must be 'all', 'administrator', 'teacher', or 'parent'");
  }

  const parsed = updateBulletinSchema.parse(input) as UpdateBulletinInput;

  try {
    const bulletin = await new BulletinsService().update(id, parsed);
    if (!bulletin) {
      throw new NotFoundError("Bulletin not found");
    }
    return bulletin;
  } catch (error) {
    if (error instanceof Error && error.message.includes("requires_initials")) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
}

/**
 * DELETE /v1/bulletins/:id — admin only.
 */
export async function deleteBulletin(id: string) {
  await requireRole("administrator");
  const deleted = await new BulletinsService().delete(id);
  if (!deleted) {
    throw new NotFoundError("Bulletin not found");
  }
  return { success: true, message: "Bulletin deleted" };
}

/**
 * POST /v1/bulletins/:id/attachments — add an attachment (admin only).
 */
export async function addBulletinAttachment(id: string, input: AddAttachmentInput) {
  await requireRole("administrator");

  if (!input.file_url || !input.file_name) {
    throw new BadRequestError("file_url and file_name are required");
  }

  const parsed = addAttachmentSchema.parse(input) as AddAttachmentInput;

  try {
    return await new BulletinsService().addAttachment(id, parsed);
  } catch (error) {
    if (error instanceof Error && error.message === "Bulletin not found") {
      throw new NotFoundError("Bulletin not found");
    }
    throw error;
  }
}

/**
 * POST /v1/bulletins/attachments/upload-url — upload target for an
 * attachment (admin only). R2 has no S3 presigning; the returned
 * upload_url is the authenticated /api/files/upload route.
 */
export async function getBulletinAttachmentUploadUrl(input: {
  file_name: string;
  content_type: string;
}) {
  await requireRole("administrator");

  if (!input.file_name || !input.content_type) {
    throw new BadRequestError("file_name and content_type are required");
  }

  const parsed = attachmentUploadUrlSchema.parse(input);
  return await new BulletinsService().getAttachmentUploadUrl(parsed);
}

/**
 * DELETE /v1/bulletins/:id/attachments/:attachmentId — admin only.
 */
export async function deleteBulletinAttachment(_id: string, attachmentId: string) {
  await requireRole("administrator");
  const deleted = await new BulletinsService().deleteAttachment(attachmentId);
  if (!deleted) {
    throw new NotFoundError("Attachment not found");
  }
  return { success: true, message: "Attachment deleted" };
}

/**
 * POST /v1/bulletins/:id/acknowledge — parent acknowledgement with initials.
 */
export async function acknowledgeBulletin(id: string, input: AcknowledgeBulletinInput) {
  const currentUser = await requireRole("parent");

  if (!input.initials || !input.initials.trim()) {
    throw new BadRequestError("initials are required");
  }

  const parsed = acknowledgeSchema.parse(input);

  try {
    return await new BulletinsService().acknowledgeBulletin(id, currentUser.id, parsed);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Bulletin not found") throw new NotFoundError("Bulletin not found");
      if (error.message.includes("Initials")) throw new BadRequestError(error.message);
      if (error.message.includes("does not require initials"))
        throw new BadRequestError(error.message);
    }
    throw error;
  }
}

/**
 * PATCH /v1/bulletins/:id/review — moderation decision (admin only).
 */
export async function reviewBulletin(id: string, input: ReviewBulletinInput) {
  const currentUser = await requireRole("administrator");

  if (!input.status || !["approved", "rejected"].includes(input.status)) {
    throw new BadRequestError("status must be 'approved' or 'rejected'");
  }

  const parsed = reviewBulletinSchema.parse(input) as ReviewBulletinInput;

  try {
    const bulletin = await new BulletinsService().reviewBulletin(id, currentUser.id, parsed);
    if (!bulletin) {
      throw new NotFoundError("Bulletin not found");
    }
    return bulletin;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Only pending bulletins")) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
}
