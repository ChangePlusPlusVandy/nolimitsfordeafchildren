"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";

import type { ConflictCheckInput } from "../_domain/types";
import { checkConflicts } from "./service";

const conflictCheckSchema = z
  .object({
    teacher_id: z.string().min(1),
    day_of_week_mask: z.number().int().min(0),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cycle_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    exclude_schedule_id: z.string().optional(),
  })
  .passthrough();

export async function checkScheduleConflicts(input: ConflictCheckInput) {
  await requireRole("administrator");
  const parsed = conflictCheckSchema.parse(input) as ConflictCheckInput;
  return await checkConflicts(parsed);
}
