import { desc, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { AttendanceTable, UserTable } from "@/_platform/db/schema";

import type { StudentAttendanceOverview } from "../_domain/types";
import { getAttendanceSummary } from "../_records/service";

export async function getStudentAttendanceOverview(
  studentId: string,
  recentLimit = 5,
): Promise<StudentAttendanceOverview> {
  const summary = await getAttendanceSummary(studentId);

  const recentEntries = await db
    .select({
      id: AttendanceTable.id,
      session_date: AttendanceTable.session_date,
      status: AttendanceTable.status,
      late_minutes: AttendanceTable.late_minutes,
      reason: AttendanceTable.reason,
      reason_text: AttendanceTable.reason_text,
      marked_at: AttendanceTable.marked_at,
      schedule_id: AttendanceTable.schedule_id,
      marked_by_user_id: UserTable.id,
      marked_by_user_name: UserTable.name,
      marked_by_user_role: UserTable.role,
    })
    .from(AttendanceTable)
    .leftJoin(UserTable, eq(AttendanceTable.marked_by, UserTable.id))
    .where(eq(AttendanceTable.student_id, studentId))
    .orderBy(desc(AttendanceTable.session_date), desc(AttendanceTable.marked_at))
    .limit(recentLimit);

  return {
    ...summary,
    recent_entries: recentEntries.map((entry) => ({
      id: entry.id,
      session_date: entry.session_date,
      status: entry.status,
      late_minutes: entry.late_minutes,
      reason: entry.reason,
      reason_text: entry.reason_text,
      marked_at: entry.marked_at,
      schedule_id: entry.schedule_id,
      marked_by: entry.marked_by_user_id
        ? {
            id: entry.marked_by_user_id,
            name: entry.marked_by_user_name!,
            role: entry.marked_by_user_role!,
          }
        : null,
    })),
  };
}
