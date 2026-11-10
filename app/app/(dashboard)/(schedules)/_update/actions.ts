"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import type { UpdateScheduleInput } from "../_domain/types";
import { updateSchedule as update } from "./service";

const updateScheduleSchema = z
  .object({
    site_id: z.string().optional(),
    session_id: z.string().nullable().optional(),
    day_of_week_mask: z.number().int().min(0).optional(),
    start_time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional(),
    end_time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional(),
    cycle_start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    cycle_end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

export async function updateScheduleById(scheduleId: string, input: UpdateScheduleInput) {
  await requireRole("administrator");
  const parsed = updateScheduleSchema.parse(input) as UpdateScheduleInput;
  const schedule = await update(scheduleId, parsed);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }
  return schedule;
}

export async function updateSchedule(scheduleId: string, input: UpdateScheduleInput) {
  await requireRole("administrator");
  const parsed = updateScheduleSchema.parse(input) as UpdateScheduleInput;
  const schedule = await update(scheduleId, parsed);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }
  return schedule;
}
