import { and, desc, eq, gte } from "drizzle-orm";

import { AttendanceTable, MakeupRequestTable } from "@/db/schema";
import { db } from "@/lib/db";
import type { ChildDetails } from "@/server/parents/types";
import { addDaysStr, todayStr } from "@/server/shared/dates";

export async function getMissedSessions(
  studentId: string,
): Promise<ChildDetails["missed_sessions"]> {
  const dateStr = addDaysStr(todayStr(), -30);

  const noShows = await db
    .select({
      id: AttendanceTable.id,
      schedule_id: AttendanceTable.schedule_id,
      session_date: AttendanceTable.session_date,
      reason: AttendanceTable.reason,
    })
    .from(AttendanceTable)
    .where(
      and(
        eq(AttendanceTable.student_id, studentId),
        eq(AttendanceTable.status, "no_show"),
        gte(AttendanceTable.session_date, dateStr),
      ),
    )
    .orderBy(desc(AttendanceTable.session_date));

  const missed: ChildDetails["missed_sessions"] = [];

  for (const noShow of noShows) {
    const existingRequest = await db
      .select({ id: MakeupRequestTable.id })
      .from(MakeupRequestTable)
      .where(
        and(
          eq(MakeupRequestTable.student_id, studentId),
          eq(MakeupRequestTable.original_schedule_id, noShow.schedule_id),
          eq(MakeupRequestTable.original_session_date, noShow.session_date),
        ),
      )
      .limit(1);

    missed.push({
      schedule_id: noShow.schedule_id,
      date: noShow.session_date,
      reason: noShow.reason,
      can_request_makeup: existingRequest.length === 0,
    });
  }

  return missed;
}
