import { z } from "zod";

export const createSessionSchema = z
  .object({
    makeup_request_id: z.string().optional(),
    student_id: z.string().min(1),
    teacher_id: z.string().min(1),
    site_id: z.string().min(1),
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    scheduled_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    notes: z.string().max(2000).optional(),
  })
  .passthrough();
