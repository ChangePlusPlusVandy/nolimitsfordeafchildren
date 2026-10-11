import { z } from "zod";

export const createRequestSchema = z
  .object({
    student_id: z.string().min(1),
    current_schedule_id: z.string().min(1),
    requested_schedule_id: z.string().optional(),
    preferred_times: z.string().max(500).optional(),
    flexibility_notes: z.string().max(2000).optional(),
    reason: z.string().min(1).max(2000),
  })
  .passthrough();
