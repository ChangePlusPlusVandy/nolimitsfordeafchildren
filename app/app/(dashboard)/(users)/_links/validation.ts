import { z } from "zod";

export const linkStudentSchema = z
  .object({
    relationship: z.string().max(100).nullable().optional(),
    is_primary: z.boolean().optional(),
  })
  .passthrough();
