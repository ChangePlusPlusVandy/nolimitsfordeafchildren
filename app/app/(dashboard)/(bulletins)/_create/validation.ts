import { z } from "zod";

export const createBulletinSchema = z
  .object({
    title: z.string().min(1).max(300),
    body: z.string().max(10000).optional(),
    scope: z.enum(["global", "site"]),
    site_id: z.string().nullable().optional(),
    role_target: z.enum(["all", "administrator", "teacher", "parent"]),
    requires_approval: z.boolean().optional(),
    requires_initials: z.boolean().optional(),
    publish_at: z.union([z.string(), z.date()]).nullable().optional(),
    expire_at: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .passthrough();
