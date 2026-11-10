"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";

import type { CreateScheduleInput } from "../_domain/types";
import { createSchedule as create } from "./service";

const createScheduleSchema = z
  .object({
    site_id: z.string().min(1),
    session_id: z.string().optional(),
    day_of_week_mask: z.number().int().min(0),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cycle_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .passthrough();

export async function createSchedule(teacherId: string, input: CreateScheduleInput) {
  await requireRole("administrator");
  const parsed = createScheduleSchema.parse(input) as CreateScheduleInput;
  return await create(teacherId, parsed);
}

export async function createTeacherSchedule(id: string, input: CreateScheduleInput) {
  await requireRole("administrator");
  const parsed = createScheduleSchema.parse(input) as CreateScheduleInput;
  return await create(id, parsed);
}
