import { z } from "zod";

export const teacherResponseSchema = z
  .object({
    response_status: z.enum(["available", "unavailable", "conditional"]),
    notes: z.string().max(2000).optional(),
  })
  .passthrough();
