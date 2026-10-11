import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  LocationTable,
  ScheduleTable,
  SessionTable,
  StudentTable,
  TeacherProfileTable,
  TeacherStudentTable,
  UserTable,
} from "@/_platform/db/schema";

import type { TeacherDetailsRecord } from "../_domain/types";
import { getTeacherLocations } from "../_locations/service";
import { resolveTeacherProfileId } from "../_resolve/service";

export async function getTeacher(id: string): Promise<TeacherDetailsRecord | null> {
  const profileId = await resolveTeacherProfileId(id);
  if (!profileId) {
    return null;
  }

  const teacherResults = await db
    .select({
      id: TeacherProfileTable.id,
      user_id: TeacherProfileTable.user_id,
      primary_site_id: TeacherProfileTable.primary_site_id,
      bio: TeacherProfileTable.bio,
      photo_url: TeacherProfileTable.photo_url,
      user_photo_url: UserTable.photo_url,
      qualifications: TeacherProfileTable.qualifications,
      credentials: TeacherProfileTable.credentials,
      age_group_specialty: TeacherProfileTable.age_group_specialty,
      created_at: TeacherProfileTable.created_at,
      updated_at: TeacherProfileTable.updated_at,
      user_name: UserTable.name,
      user_email: UserTable.email,
      user_phone: UserTable.phone,
      user_is_active: UserTable.is_active,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
    })
    .from(TeacherProfileTable)
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .leftJoin(LocationTable, eq(TeacherProfileTable.primary_site_id, LocationTable.id))
    .where(eq(TeacherProfileTable.id, profileId))
    .limit(1);

  if (teacherResults.length === 0) {
    return null;
  }

  const row = teacherResults[0]!;
  const teacherLocations = await getTeacherLocations(profileId);

  const scheduleResults = await db
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
      schedule_site_id: LocationTable.id,
      schedule_site_name: LocationTable.name,
      session_name: SessionTable.name,
    })
    .from(ScheduleTable)
    .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
    .leftJoin(SessionTable, eq(ScheduleTable.session_id, SessionTable.id))
    .where(eq(ScheduleTable.teacher_id, profileId));

  const schedules = scheduleResults.map((s) => ({
    id: s.id,
    teacher_id: s.teacher_id,
    site_id: s.site_id,
    session_id: s.session_id,
    day_of_week_mask: s.day_of_week_mask,
    start_time: s.start_time,
    end_time: s.end_time,
    cycle_start_date: s.cycle_start_date,
    cycle_end_date: s.cycle_end_date,
    is_active: s.is_active,
    created_at: s.created_at,
    updated_at: s.updated_at,
    site: { id: s.schedule_site_id, name: s.schedule_site_name },
    session: s.session_id ? { id: s.session_id, name: s.session_name || "Session" } : null,
  }));

  const studentResults = await db
    .select({
      id: StudentTable.id,
      first_name: StudentTable.first_name,
      last_name: StudentTable.last_name,
      initials: StudentTable.initials,
      student_site_id: LocationTable.id,
      student_site_name: LocationTable.name,
    })
    .from(TeacherStudentTable)
    .innerJoin(StudentTable, eq(TeacherStudentTable.student_id, StudentTable.id))
    .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
    .where(
      and(eq(TeacherStudentTable.teacher_id, profileId), isNull(TeacherStudentTable.unassigned_at)),
    );

  const students = studentResults.map((s) => ({
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    initials: s.initials,
    site: { id: s.student_site_id, name: s.student_site_name },
  }));

  return {
    id: row.id,
    user_id: row.user_id,
    primary_site_id: row.primary_site_id,
    bio: row.bio,
    photo_url: row.photo_url || row.user_photo_url,
    qualifications: row.qualifications,
    credentials: row.credentials,
    age_group_specialty: row.age_group_specialty,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      phone: row.user_phone,
      is_active: row.user_is_active,
    },
    primarySite: row.site_id ? { id: row.site_id, name: row.site_name! } : null,
    locations: teacherLocations,
    schedules,
    students,
  };
}
