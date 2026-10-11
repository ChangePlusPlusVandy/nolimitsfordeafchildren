import { z } from "zod";

import { USER_ROLES } from "../_domain/types";

export const inviteUserSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).max(200),
    role: z.enum(USER_ROLES),
    phone: z.string().max(50).nullable().optional(),
    primary_site_id: z.string().optional(),
  })
  .passthrough();
