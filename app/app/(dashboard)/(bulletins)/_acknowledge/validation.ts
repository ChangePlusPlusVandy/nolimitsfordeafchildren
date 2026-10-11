import { z } from "zod";

export const acknowledgeSchema = z
  .object({
    initials: z.string().min(1).max(8),
  })
  .passthrough();
