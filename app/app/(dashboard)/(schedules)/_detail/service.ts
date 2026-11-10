import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  EnrollmentTable,
  LocationTable,
  ScheduleTable,
  SessionTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
} from "@/_platform/db/schema";

import type { ScheduleDetails } from "../_domain/types";

export async function getSchedule(id: string): Promise<ScheduleDetails | null> {
  const results = await db
    .select({
      id: ScheduleTable.id,
      teacher_id: ScheduleTable.teacher_id,
      site_id: ScheduleTable.site_id,
      session_id: ScheduleTable.session_id,
      day_of_week_mask: ScheduleTable.day_of_week_mask,
      start_time: ScheduleTable.start_time,
      end_time: ScheduleTable.end_time,
      cycle_start_date: ScheduleTable.cycle_start_date,
      cycle_end_date: ScheduleTable.cycle_end_date,
      is_active: ScheduleTable.is_active,
      created_at: ScheduleTable.created_at,
      updated_at: ScheduleTable.updated_at,
      teacher_profile_id: TeacherProfileTable.id,
      user_id: UserTable.id,
      user_name: UserTable.name,
      user_email: UserTable.email,
      location_id: LocationTable.id,
      location_name: LocationTable.name,
      session_name: SessionTable.name,
    })
    .from(ScheduleTable)
    .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
    .leftJoin(SessionTable, eq(ScheduleTable.session_id, SessionTable.id))
    .where(eq(ScheduleTable.id, id))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const r = results[0]!;

  const enrollments = await db
    .select({
      student_id: StudentTable.id,
      first_name: StudentTable.first_name,
      last_name: StudentTable.last_name,
      initials: StudentTable.initials,
      enrolled_at: EnrollmentTable.enrolled_at,
    })
    .from(EnrollmentTable)
    .innerJoin(StudentTable, eq(EnrollmentTable.student_id, StudentTable.id))
    .where(and(eq(EnrollmentTable.schedule_id, id), isNull(EnrollmentTable.ended_at)))
    .orderBy(asc(StudentTable.last_name));

  const enrolledStudents = enrollments.map((e) => ({
    id: e.student_id,
    first_name: e.first_name,
    last_name: e.last_name,
    initials: e.initials,
    enrolled_at: e.enrolled_at,
  }));

  return {
    id: r.id,
    teacher_id: r.teacher_id,
    site_id: r.site_id,
    session_id: r.session_id,
    day_of_week_mask: r.day_of_week_mask,
    start_time: r.start_time,
    end_time: r.end_time,
    cycle_start_date: r.cycle_start_date,
    cycle_end_date: r.cycle_end_date,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
    teacher: {
      id: r.teacher_profile_id,
      user: { id: r.user_id, name: r.user_name, email: r.user_email },
    },
    site: { id: r.location_id, name: r.location_name },
    session: r.session_id ? { id: r.session_id, name: r.session_name || "Session" } : null,
    enrolledStudents,
  };
}
