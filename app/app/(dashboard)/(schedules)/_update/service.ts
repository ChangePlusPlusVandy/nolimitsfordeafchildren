import { eq } from "drizzle-orm";

import { isTeacherAssignedToLocation } from "@/(dashboard)/(teachers)/_domain/access";
import { db } from "@/_platform/db";
import {
  type ScheduleEntity,
  type ScheduleInsert,
  ScheduleTable,
  SessionTable,
} from "@/_platform/db/schema";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/_shared/server/errors";

import { checkConflicts } from "../_conflicts/service";
import type { UpdateScheduleInput } from "../_domain/types";

export async function updateSchedule(
  scheduleId: string,
  input: UpdateScheduleInput,
): Promise<ScheduleEntity | null> {
  const existing = await db
    .select()
    .from(ScheduleTable)
    .where(eq(ScheduleTable.id, scheduleId))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  if (input.site_id && input.site_id !== existing[0]!.site_id) {
    const isAssigned = await isTeacherAssignedToLocation(existing[0]!.teacher_id, input.site_id);
    if (!isAssigned) {
      throw new ForbiddenError("Teacher is not assigned to this location");
    }
  }

  if (input.session_id !== undefined && input.session_id !== null && input.session_id !== "") {
    const session = await db
      .select({ id: SessionTable.id, is_archived: SessionTable.is_archived })
      .from(SessionTable)
      .where(eq(SessionTable.id, input.session_id))
      .limit(1);

    if (!session[0]) {
      throw new NotFoundError("Session not found");
    }

    if (session[0].is_archived) {
      throw new BadRequestError("Cannot assign an archived session to a schedule");
    }
  }

  if (
    input.day_of_week_mask !== undefined ||
    input.start_time !== undefined ||
    input.end_time !== undefined ||
    input.cycle_start_date !== undefined ||
    input.cycle_end_date !== undefined
  ) {
    const conflictResult = await checkConflicts({
      teacher_id: existing[0]!.teacher_id,
      day_of_week_mask: input.day_of_week_mask ?? existing[0]!.day_of_week_mask,
      start_time: input.start_time ?? existing[0]!.start_time,
      end_time: input.end_time ?? existing[0]!.end_time,
      cycle_start_date: input.cycle_start_date ?? existing[0]!.cycle_start_date,
      cycle_end_date: input.cycle_end_date ?? existing[0]!.cycle_end_date,
      exclude_schedule_id: scheduleId,
    });

    if (conflictResult.hasConflict) {
      throw new ConflictError(
        `Schedule conflicts with existing schedules: ${conflictResult.conflicts.map((c) => c.id).join(", ")}`,
      );
    }
  }

  const updateData: Partial<ScheduleInsert> = { updated_at: new Date() };

  if (input.site_id !== undefined) {
    updateData.site_id = input.site_id;
  }
  if (input.session_id !== undefined) {
    updateData.session_id = input.session_id || null;
  }
  if (input.day_of_week_mask !== undefined) {
    updateData.day_of_week_mask = input.day_of_week_mask;
  }
  if (input.start_time !== undefined) {
    updateData.start_time = input.start_time;
  }
  if (input.end_time !== undefined) {
    updateData.end_time = input.end_time;
  }
  if (input.cycle_start_date !== undefined) {
    updateData.cycle_start_date = input.cycle_start_date;
  }
  if (input.cycle_end_date !== undefined) {
    updateData.cycle_end_date = input.cycle_end_date;
  }
  if (input.is_active !== undefined) {
    updateData.is_active = input.is_active;
  }

  const result = await db
    .update(ScheduleTable)
    .set(updateData)
    .where(eq(ScheduleTable.id, scheduleId))
    .returning();

  return result[0] ?? null;
}
