import { z } from "zod";

export const createNoteSchema = z
  .object({
    note: z.string().min(1).max(5000),
    schedule_id: z.string().optional(),
    session_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .passthrough();
