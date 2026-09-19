import { and, desc, eq, gte, isNull } from "drizzle-orm";

import {
  AttendanceTable,
  EnrollmentTable,
  LocationTable,
  ScheduleTable,
  TeacherProfileTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import type { ChildScheduleSession, LinkedChild } from "@/server/parents/types";
import {
  addDaysStr,
  compareDateStr,
  dayOfWeek,
  eachDateStrInRange,
  todayStr,
} from "@/server/shared/dates";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dayMaskForDateStr(dateStr: string): number {
  return 1 << dayOfWeek(dateStr);
}

export async function getCurrentScheduleId(studentId: string): Promise<string | null> {
  const enrollment = await db
    .select({
      schedule_id: EnrollmentTable.schedule_id,
    })
    .from(EnrollmentTable)
    .where(and(eq(EnrollmentTable.student_id, studentId), isNull(EnrollmentTable.ended_at)))
    .orderBy(desc(EnrollmentTable.enrolled_at))
    .limit(1);

  return enrollment[0]?.schedule_id ?? null;
}

export async function getNextSession(studentId: string): Promise<LinkedChild["next_session"]> {
  const today = todayStr();

  const enrollments = await db
    .select({
      schedule_id: ScheduleTable.id,
      day_of_week_mask: ScheduleTable.day_of_week_mask,
      start_time: ScheduleTable.start_time,
      cycle_start_date: ScheduleTable.cycle_start_date,
      cycle_end_date: ScheduleTable.cycle_end_date,
      teacher_name: UserTable.name,
    })
    .from(EnrollmentTable)
    .innerJoin(ScheduleTable, eq(EnrollmentTable.schedule_id, ScheduleTable.id))
    .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .where(
      and(
        eq(EnrollmentTable.student_id, studentId),
        isNull(EnrollmentTable.ended_at),
        eq(ScheduleTable.is_active, true),
        gte(ScheduleTable.cycle_end_date, today),
      ),
    );

  if (enrollments.length === 0) {
    return null;
  }

  let nextDate: string | null = null;
  let nextSchedule: (typeof enrollments)[0] | null = null;

  for (const enrollment of enrollments) {
    let checkDate =
      compareDateStr(today, enrollment.cycle_start_date) >= 0 ? today : enrollment.cycle_start_date;

    for (let i = 0; i < 30; i++) {
      if (compareDateStr(checkDate, enrollment.cycle_end_date) > 0) {
        break;
      }

      if ((enrollment.day_of_week_mask & dayMaskForDateStr(checkDate)) !== 0) {
        if (!nextDate || compareDateStr(checkDate, nextDate) < 0) {
          nextDate = checkDate;
          nextSchedule = enrollment;
        }
        break;
      }

      checkDate = addDaysStr(checkDate, 1);
    }
  }

  if (!nextDate || !nextSchedule) {
    return null;
  }

  return {
    date: nextDate,
    time: nextSchedule.start_time,
    teacher_name: nextSchedule.teacher_name,
  };
}

export async function getScheduledSessions(
  studentId: string,
  daysRange: number,
  direction: "future" | "past",
): Promise<ChildScheduleSession[]> {
  const today = todayStr();
  const rangeEnd =
    direction === "future" ? addDaysStr(today, daysRange) : addDaysStr(today, -daysRange);

  const startDate = direction === "future" ? today : rangeEnd;
  const endDate = direction === "future" ? rangeEnd : today;

  const enrollments = await db
    .select({
      schedule_id: ScheduleTable.id,
      day_of_week_mask: ScheduleTable.day_of_week_mask,
      start_time: ScheduleTable.start_time,
      end_time: ScheduleTable.end_time,
      cycle_start_date: ScheduleTable.cycle_start_date,
      cycle_end_date: ScheduleTable.cycle_end_date,
      teacher_id: TeacherProfileTable.id,
      teacher_name: UserTable.name,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
    })
    .from(EnrollmentTable)
    .innerJoin(ScheduleTable, eq(EnrollmentTable.schedule_id, ScheduleTable.id))
    .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
    .where(
      and(
        eq(EnrollmentTable.student_id, studentId),
        isNull(EnrollmentTable.ended_at),
        eq(ScheduleTable.is_active, true),
      ),
    );

  const sessions: ChildScheduleSession[] = [];

  for (const enrollment of enrollments) {
    const windowStart =
      compareDateStr(startDate, enrollment.cycle_start_date) >= 0
        ? startDate
        : enrollment.cycle_start_date;
    const windowEnd =
      compareDateStr(endDate, enrollment.cycle_end_date) <= 0 ? endDate : enrollment.cycle_end_date;

    if (compareDateStr(windowStart, windowEnd) > 0) {
      continue;
    }

    for (const dateStr of eachDateStrInRange(windowStart, windowEnd)) {
      if ((enrollment.day_of_week_mask & dayMaskForDateStr(dateStr)) === 0) {
        continue;
      }

      const attendance = await db
        .select()
        .from(AttendanceTable)
        .where(
          and(
            eq(AttendanceTable.student_id, studentId),
            eq(AttendanceTable.schedule_id, enrollment.schedule_id),
            eq(AttendanceTable.session_date, dateStr),
          ),
        )
        .limit(1);

      sessions.push({
        schedule_id: enrollment.schedule_id,
        date: dateStr,
        day_of_week: DAY_NAMES[dayOfWeek(dateStr)]!,
        start_time: enrollment.start_time,
        end_time: enrollment.end_time,
        teacher: {
          id: enrollment.teacher_id,
          name: enrollment.teacher_name,
        },
        site: {
          id: enrollment.site_id,
          name: enrollment.site_name,
        },
        attendance_status: attendance[0]?.status || null,
      });
    }
  }

  sessions.sort((a, b) => {
    if (direction === "future") {
      return a.date.localeCompare(b.date);
    }
    return b.date.localeCompare(a.date);
  });

  return sessions.slice(0, 10);
}
