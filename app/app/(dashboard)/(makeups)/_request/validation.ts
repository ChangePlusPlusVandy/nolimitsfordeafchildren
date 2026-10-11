import { z } from "zod";

export const createRequestSchema = z
  .object({
    student_id: z.string().min(1),
    original_session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    original_schedule_id: z.string().min(1),
    reason: z.enum([
      "sick",
      "family_emergency",
      "transportation",
      "schedule_conflict",
      "no_show_unknown",
      "other",
    ]),
    reason_text: z.string().max(1000).optional(),
    preferred_dates: z.string().max(500).optional(),
  })
  .passthrough();
