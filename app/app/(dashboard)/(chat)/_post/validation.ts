import { z } from "zod";

export const createMessageSchema = z
  .object({
    channel: z.enum(["community", "teacher"]),
    message: z.string().min(1).max(2000),
    is_announcement: z.boolean().optional(),
  })
  .passthrough();
