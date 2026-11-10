import { z } from "zod";

import { USER_ROLES } from "../_domain/types";

export const updateUserSchema = z
  .object({
    name: z.string().max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).nullable().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    locale: z.string().max(20).optional(),
    role: z.enum(USER_ROLES).optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();
