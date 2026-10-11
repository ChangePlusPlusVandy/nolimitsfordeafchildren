import { z } from "zod";

export const guardianSummarySchema = z
  .object({
    guardian_summary: z.string().max(5000).nullable().optional(),
  })
  .passthrough();
