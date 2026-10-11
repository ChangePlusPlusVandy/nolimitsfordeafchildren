import { z } from "zod";

import { focusSchema } from "../_form/validation";

export const updateAssessmentSchema = z
  .object({
    teaching_focus: z.string().min(1).max(500).optional(),
    focuses: z.array(focusSchema).optional(),
    summary: z.string().max(2000).nullable().optional(),
    score: z.number().int().min(0).max(20).optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();
