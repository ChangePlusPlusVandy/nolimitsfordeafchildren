"use server";

import { z } from "zod";
import {
  type ConflictCheckInput,
  type CreateScheduleInput,
  SchedulesService,
  type UpdateScheduleInput,
} from "@/server/schedules/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

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

/**
 * POST /v1/schedules/conflicts/check — admin only.
 */
export async function checkScheduleConflicts(input: ConflictCheckInput) {
  await requireRole("administrator");
  const parsed = conflictCheckSchema.parse(input) as ConflictCheckInput;
  return await new SchedulesService().checkConflicts(parsed);
}

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

/**
 * POST /v1/teachers/:id/schedules — create a schedule (admin only).
 */
export async function createSchedule(teacherId: string, input: CreateScheduleInput) {
  await requireRole("administrator");
  const parsed = createScheduleSchema.parse(input) as CreateScheduleInput;
  return await new SchedulesService().create(teacherId, parsed);
}

/**
 * PATCH /v1/schedules/:scheduleId — update a schedule (admin only).
 */
export async function updateScheduleById(scheduleId: string, input: UpdateScheduleInput) {
  await requireRole("administrator");
  const parsed = updateScheduleSchema.parse(input) as UpdateScheduleInput;
  const schedule = await new SchedulesService().update(scheduleId, parsed);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }
  return schedule;
}
