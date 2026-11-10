import type { ScheduleEntity } from "@/_platform/db/schema";

import type { ConflictCheckInput, UpdateScheduleInput } from "../_domain/types";

type SchedulingFields = Pick<
  ScheduleEntity,
  | "teacher_id"
  | "day_of_week_mask"
  | "start_time"
  | "end_time"
  | "cycle_start_date"
  | "cycle_end_date"
  | "is_active"
>;

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

/**
 * Returns the conflict check to run for an update, or null when none is needed:
 * inactive results never conflict, and unchanged active schedules keep any
 * pre-existing overlap rather than blocking unrelated edits.
 */
export function conflictCheckForUpdate(
  scheduleId: string,
  existing: SchedulingFields,
  input: UpdateScheduleInput,
): ConflictCheckInput | null {
  const resulting = {
    day_of_week_mask: input.day_of_week_mask ?? existing.day_of_week_mask,
    start_time: input.start_time ?? existing.start_time,
    end_time: input.end_time ?? existing.end_time,
    cycle_start_date: input.cycle_start_date ?? existing.cycle_start_date,
    cycle_end_date: input.cycle_end_date ?? existing.cycle_end_date,
    is_active: input.is_active ?? existing.is_active,
  };

  if (!resulting.is_active) {
    return null;
  }

  const reactivated = !existing.is_active;
  const schedulingChanged =
    resulting.day_of_week_mask !== existing.day_of_week_mask ||
    normalizeTime(resulting.start_time) !== normalizeTime(existing.start_time) ||
    normalizeTime(resulting.end_time) !== normalizeTime(existing.end_time) ||
    resulting.cycle_start_date !== existing.cycle_start_date ||
    resulting.cycle_end_date !== existing.cycle_end_date;

  if (!reactivated && !schedulingChanged) {
    return null;
  }

  return {
    teacher_id: existing.teacher_id,
    day_of_week_mask: resulting.day_of_week_mask,
    start_time: resulting.start_time,
    end_time: resulting.end_time,
    cycle_start_date: resulting.cycle_start_date,
    cycle_end_date: resulting.cycle_end_date,
    exclude_schedule_id: scheduleId,
  };
}
