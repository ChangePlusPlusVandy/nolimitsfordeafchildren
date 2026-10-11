import { z } from "zod";

export const updateMeSchema = z
  .object({
    name: z.string().max(200).optional(),
    phone: z.string().max(50).nullable().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    locale: z.string().max(20).optional(),
    address_line1: z.string().max(200).nullable().optional(),
    address_line2: z.string().max(200).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    state: z.string().max(2).nullable().optional(),
    postal_code: z.string().max(20).nullable().optional(),
  })
  .passthrough();
