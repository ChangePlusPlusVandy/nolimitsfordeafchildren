import { eq } from "drizzle-orm";

import { attendanceService } from "@/(dashboard)/(attendance)/_domain/server";
import type { SessionForDay } from "@/(dashboard)/(attendance)/_domain/types";
import { db } from "@/_platform/db";
import { TeacherProfileTable } from "@/_platform/db/schema";
import { todayStr } from "@/_shared/server/dates";
import { NotFoundError } from "@/_shared/server/errors";

export async function getMyDayForUser(
  userId: string,
  query: { date?: string; start_date?: string; end_date?: string },
) {
  const teacherProfile = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, userId))
    .limit(1);

  if (teacherProfile.length === 0) {
    throw new NotFoundError("Teacher profile not found for current user");
  }

  return await myDay({
    date: query.date,
    start_date: query.start_date,
    end_date: query.end_date,
    teacher_id: teacherProfile[0].id,
  });
}

export async function myDay(query: {
  date?: string;
  start_date?: string;
  end_date?: string;
  teacher_id?: string;
}): Promise<{ sessions: SessionForDay[] }> {
  const teacherId = query.teacher_id;
  if (!teacherId) {
    return { sessions: [] };
  }

  if (query.start_date && query.end_date) {
    const sessions = await attendanceService.getTeacherSessionsInRange(
      teacherId,
      query.start_date,
      query.end_date,
    );
    return { sessions };
  }

  const date = query.date || todayStr();
  const sessions = await attendanceService.getTeacherDaySessions(teacherId, date);

  return { sessions };
}
