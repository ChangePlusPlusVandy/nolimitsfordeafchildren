import { z } from "zod";

import { focusSchema } from "../_form/validation";

export const createAssessmentSchema = z
  .object({
    cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    assessment_type: z.enum(["pre", "post"]),
    teaching_focus: z.string().min(1).max(500),
    summary: z.string().max(2000).nullable().optional(),
    focuses: z.array(focusSchema).optional(),
    score: z.number().int().min(0).max(20),
    notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();
