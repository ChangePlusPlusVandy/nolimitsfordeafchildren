import { z } from "zod";

export const reviewDocumentSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    review_notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();
