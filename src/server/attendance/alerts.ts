import { and, eq } from "drizzle-orm";
import {
  LocationTable,
  ScheduleTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { sendMissedSessionAlert } from "@/lib/email";
import type { AbsenceReason } from "@/server/attendance/types";

export async function sendNoShowAlerts(params: {
  student_id: string;
  schedule_id: string;
  session_date: string;
  reason?: AbsenceReason;
}): Promise<void> {
  const details = await db
    .select({
      student_first_name: StudentTable.first_name,
      student_last_name: StudentTable.last_name,
      student_initials: StudentTable.initials,
      teacher_name: UserTable.name,
      site_name: LocationTable.name,
    })
    .from(ScheduleTable)
    .innerJoin(StudentTable, eq(StudentTable.id, params.student_id))
    .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
    .where(eq(ScheduleTable.id, params.schedule_id))
    .limit(1);

  if (details.length === 0) {
    return;
  }

  const row = details[0]!;
  const studentName = `${row.student_first_name} ${row.student_last_name}`;

  const admins = await db
    .select({ email: UserTable.email })
    .from(UserTable)
    .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)));

  for (const admin of admins) {
    if (!admin.email) {
      continue;
    }

    await sendMissedSessionAlert(
      admin.email,
      studentName,
      row.student_initials,
      params.session_date,
      row.teacher_name,
      row.site_name,
      params.reason,
    );
  }
}
