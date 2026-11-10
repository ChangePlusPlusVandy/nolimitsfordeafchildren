import type { ConflictCheckInput, ConflictResult } from "../_domain/types";

export function findConflicts(
  input: ConflictCheckInput,
  existingSchedules: ConflictResult["conflicts"],
): ConflictResult {
  const conflicts: ConflictResult["conflicts"] = [];

  for (const schedule of existingSchedules) {
    const daysOverlap = (schedule.day_of_week_mask & input.day_of_week_mask) !== 0;
    if (!daysOverlap) {
      continue;
    }

    const inputStart = new Date(input.cycle_start_date);
    const inputEnd = new Date(input.cycle_end_date);
    const schedStart = new Date(schedule.cycle_start_date);
    const schedEnd = new Date(schedule.cycle_end_date);

    const datesOverlap = inputStart <= schedEnd && inputEnd >= schedStart;
    if (!datesOverlap) {
      continue;
    }

    // Adjacent times do not conflict; cycle boundary dates are inclusive.
    const timesOverlap =
      input.start_time < schedule.end_time && input.end_time > schedule.start_time;
    if (!timesOverlap) {
      continue;
    }

    conflicts.push({
      id: schedule.id,
      day_of_week_mask: schedule.day_of_week_mask,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      cycle_start_date: schedule.cycle_start_date,
      cycle_end_date: schedule.cycle_end_date,
    });
  }

  return { hasConflict: conflicts.length > 0, conflicts };
}
