import { z } from "zod";

export const focusSchema = z.object({
  goal: z.string().min(1).max(500),
  score: z.number().int().min(0).max(20),
  max_score: z.number().int().min(1).max(20),
});
