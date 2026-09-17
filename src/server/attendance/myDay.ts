import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import {
  AttendanceSiblingParticipantTable,
  AttendanceTable,
  EnrollmentTable,
  LocationTable,
  ScheduleTable,
  SiblingTable,
  StudentTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import type { SessionForDay } from "@/server/attendance/types";
import { dayOfWeek, eachDateStrInRange } from "@/server/shared/dates";
import { BadRequestError } from "@/server/shared/errors";

export async function getTeacherDaySessions(
  teacherProfileId: string,
  date: string,
): Promise<SessionForDay[]> {
  const dayMask = 1 << dayOfWeek(date);

  const schedules = await db
    .select({
      schedule_id: ScheduleTable.id,
      start_time: ScheduleTable.start_time,
      end_time: ScheduleTable.end_time,
      day_of_week_mask: ScheduleTable.day_of_week_mask,
      cycle_start_date: ScheduleTable.cycle_start_date,
      cycle_end_date: ScheduleTable.cycle_end_date,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
    })
    .from(ScheduleTable)
    .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
    .where(
      and(
        eq(ScheduleTable.teacher_id, teacherProfileId),
        eq(ScheduleTable.is_active, true),
        lte(ScheduleTable.cycle_start_date, date),
        gte(ScheduleTable.cycle_end_date, date),
        sql`(${ScheduleTable.day_of_week_mask} & ${dayMask}) != 0`,
      ),
    );

  if (schedules.length === 0) {
    return [];
  }

  const scheduleIds = schedules.map((s) => s.schedule_id);

  const enrollments = await db
    .select({
      schedule_id: EnrollmentTable.schedule_id,
      student_id: StudentTable.id,
      student_initials: StudentTable.initials,
      student_first_name: StudentTable.first_name,
      student_last_name: StudentTable.last_name,
    })
    .from(EnrollmentTable)
    .innerJoin(StudentTable, eq(EnrollmentTable.student_id, StudentTable.id))
    .where(
      and(
        inArray(EnrollmentTable.schedule_id, scheduleIds),
        isNull(EnrollmentTable.ended_at),
        eq(StudentTable.is_active, true),
      ),
    );

  const existingAttendance = await db
    .select()
    .from(AttendanceTable)
    .where(
      and(
        inArray(AttendanceTable.schedule_id, scheduleIds),
        eq(AttendanceTable.session_date, date),
      ),
    );

  const existingAttendanceIds = existingAttendance.map((attendance) => attendance.id);
  const siblingParticipantsByAttendance = new Map<
    string,
    Array<{
      sibling_id: string;
      name: string;
      relationship: string;
    }>
  >();

  if (existingAttendanceIds.length > 0) {
    const siblingParticipants = await db
      .select({
        attendance_id: AttendanceSiblingParticipantTable.attendance_id,
        sibling_id: SiblingTable.id,
        name: SiblingTable.name,
        relationship: SiblingTable.relationship,
      })
      .from(AttendanceSiblingParticipantTable)
      .innerJoin(SiblingTable, eq(AttendanceSiblingParticipantTable.sibling_id, SiblingTable.id))
      .where(inArray(AttendanceSiblingParticipantTable.attendance_id, existingAttendanceIds));

    for (const siblingParticipant of siblingParticipants) {
      const list = siblingParticipantsByAttendance.get(siblingParticipant.attendance_id) ?? [];
      list.push({
        sibling_id: siblingParticipant.sibling_id,
        name: siblingParticipant.name,
        relationship: siblingParticipant.relationship,
      });
      siblingParticipantsByAttendance.set(siblingParticipant.attendance_id, list);
    }
  }

  const sessions: SessionForDay[] = [];

  for (const enrollment of enrollments) {
    const schedule = schedules.find((s) => s.schedule_id === enrollment.schedule_id)!;
    const attendance = existingAttendance.find(
      (a) => a.student_id === enrollment.student_id && a.schedule_id === enrollment.schedule_id,
    );

    sessions.push({
      session_date: date,
      schedule_id: enrollment.schedule_id,
      student_id: enrollment.student_id,
      student_initials: enrollment.student_initials,
      student_first_name: enrollment.student_first_name,
      student_last_name: enrollment.student_last_name,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      site_id: schedule.site_id,
      site_name: schedule.site_name,
      attendance: attendance
        ? {
            id: attendance.id,
            status: attendance.status,
            late_minutes: attendance.late_minutes,
            reason: attendance.reason,
            reason_text: attendance.reason_text,
            marked_at: attendance.marked_at,
            sibling_participants: siblingParticipantsByAttendance.get(attendance.id) ?? [],
          }
        : null,
    });
  }

  sessions.sort((a, b) => {
    if (a.start_time !== b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    return a.student_last_name.localeCompare(b.student_last_name);
  });

  return sessions;
}

export async function getTeacherSessionsInRange(
  teacherProfileId: string,
  startDate: string,
  endDate: string,
): Promise<SessionForDay[]> {
  if (startDate > endDate) {
    throw new BadRequestError("Start date must be before or equal to end date");
  }

  const sessions: SessionForDay[] = [];

  for (const currentDate of eachDateStrInRange(startDate, endDate)) {
    const daySessions = await getTeacherDaySessions(teacherProfileId, currentDate);
    sessions.push(...daySessions);
  }

  sessions.sort((a, b) => {
    if (a.session_date !== b.session_date) {
      return a.session_date.localeCompare(b.session_date);
    }

    if (a.start_time !== b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }

    return a.student_last_name.localeCompare(b.student_last_name);
  });

  return sessions;
}
