import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ScheduleTable } from "@/_platform/db/schema";
import { todayStr } from "@/_shared/server/dates";

export async function nowNext(siteId: string, query?: { date?: string }) {
  const today = query?.date ?? todayStr();

  const schedules = await db
    .select()
    .from(ScheduleTable)
    .where(
      and(
        eq(ScheduleTable.site_id, siteId),
        eq(ScheduleTable.is_active, true),
        lte(ScheduleTable.cycle_start_date, today),
        gte(ScheduleTable.cycle_end_date, today),
      ),
    )
    .orderBy(ScheduleTable.start_time);

  // Preserve the existing time-only grouping, without day-mask filtering.
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;

  const nowSchedules = schedules.filter(
    (s) => s.start_time <= currentTime && s.end_time > currentTime,
  );
  const nextSchedules = schedules.filter((s) => s.start_time > currentTime);

  return { now: nowSchedules, next: nextSchedules.slice(0, 5) };
}
