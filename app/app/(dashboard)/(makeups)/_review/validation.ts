import { z } from "zod";

export const reviewRequestSchema = z
  .object({
    status: z.enum(["approved", "denied"]),
    review_notes: z.string().max(2000).optional(),
  })
  .passthrough();
