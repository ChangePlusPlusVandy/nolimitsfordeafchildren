import { z } from "zod";

export const linkParentSchema = z
  .object({
    parent_id: z.string().min(1),
    relationship: z.string().max(100).nullable().optional(),
    is_primary: z.boolean().optional(),
  })
  .passthrough();
