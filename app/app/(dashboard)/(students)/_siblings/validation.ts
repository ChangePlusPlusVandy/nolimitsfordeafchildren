import { z } from "zod";

export const siblingSchema = z
  .object({
    name: z.string().max(200),
    age: z.number().int().min(0).max(21).optional(),
    relationship: z.string().max(100),
    is_participant: z.boolean().optional(),
    has_hearing_loss: z.boolean().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();
