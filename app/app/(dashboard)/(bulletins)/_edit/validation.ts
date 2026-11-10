import { z } from "zod";

export const updateBulletinSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    body: z.string().max(10000).optional(),
    scope: z.enum(["global", "site"]).optional(),
    site_id: z.string().nullable().optional(),
    role_target: z.enum(["all", "administrator", "teacher", "parent"]).optional(),
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
