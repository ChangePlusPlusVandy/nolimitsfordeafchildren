import { formatDate, formatTime } from "@/_shared/utils/formatDate";

import type { ConflictResult } from "../_domain/types";
import { decodeDayMask } from "../_patterns/days";

export function formatConflictMessage(conflicts: ConflictResult["conflicts"]): string {
  const descriptions = conflicts.map(
    (conflict) =>
      `${decodeDayMask(conflict.day_of_week_mask).join("/")} ${formatTime(conflict.start_time)} - ${formatTime(conflict.end_time)} (${formatDate(conflict.cycle_start_date)} to ${formatDate(conflict.cycle_end_date)})`,
  );
  return `Schedule conflicts with existing schedules: ${descriptions.join("; ")}`;
}
