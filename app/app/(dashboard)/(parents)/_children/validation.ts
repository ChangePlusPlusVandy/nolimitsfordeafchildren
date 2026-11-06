import { z } from "zod";

import { siblingSchema } from "@/(dashboard)/(students)/_siblings/validation";

// Parent mutations must not accept internal fields such as student_id.
// siblingSchema uses .passthrough() for admin paths; .strip() removes all
// unknown keys so a crafted payload cannot move a sibling to another student
// or inject arbitrary columns into the .set() call.
export const parentSiblingAddSchema = siblingSchema.strip();
export const parentSiblingUpdateSchema = siblingSchema.strip().partial();

// Standalone strict schema — avoids inheriting .passthrough() from
// updateStudentSchema.pick(), which would otherwise let site_id, is_active,
// and other sensitive fields reach UpdateStudentService.update.
export const parentHearingInfoSchema = z
  .object({
    hearing_devices: z.array(z.string()),
    hearing_loss_type: z
      .enum(["mild", "moderate", "moderately_severe", "severe", "profound", "unknown"])
      .nullable(),
  })
  .strict();

export type HearingInfoInput = z.infer<typeof parentHearingInfoSchema>;
