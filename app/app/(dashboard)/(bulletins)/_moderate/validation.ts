import { z } from "zod";

export const reviewBulletinSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    notes: z.string().max(2000).optional(),
  })
  .passthrough();
