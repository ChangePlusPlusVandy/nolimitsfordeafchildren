"use server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  type AgeGroupSpecialty,
  BulletinTable,
  LocationTable,
  TeacherProfileTable,
  TeacherSickDayNoticeTable,
  type UserEntity,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { requireRole } from "@/server/shared/auth-guard";
import { ForbiddenError, NotFoundError } from "@/server/shared/errors";
import {
  assertCanViewTeacherProfile,
  getTeacherProfileIdForUser,
} from "@/server/shared/student-access";
import { type ListTeachersQuery, teachersService } from "@/server/teachers/service";

/**
 * GET /v1/teachers — list teachers (admin only).
 */
export async function listTeachers(query: ListTeachersQuery = {}) {
  await requireRole("administrator");
  return await teachersService.index(query);
}

/**
 * GET /v1/teachers/:id — public (no role gate).
 * `id` is teacher_profiles.id (canonical) or users.id (User Management links).
 */
export async function getTeacher(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const teacher = await teachersService.show(id);
  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }
  await assertCanViewTeacherProfile(user, teacher.id);
  return teacher;
}

export async function getTeacherStudents(
  id: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole("administrator", "teacher");
  const profileId = await teachersService.resolveTeacherProfileId(id);
  if (!profileId) {
    throw new NotFoundError("Teacher not found");
  }
  if (user.role === "teacher") {
    const callerProfileId = await getTeacherProfileIdForUser(user.id);
    if (callerProfileId !== profileId) {
      throw new ForbiddenError("You can only list your assigned students");
    }
  }
  return await teachersService.students(profileId, query);
}

/**
 * GET /v1/teachers/:id/locations — admin only.
 */
export async function getTeacherLocations(id: string) {
  await requireRole("administrator");
  const profileId = await teachersService.resolveTeacherProfileId(id);
  if (!profileId) {
    throw new NotFoundError("Teacher not found");
  }
  return await teachersService.getTeacherLocations(profileId);
}

/**
 * GET /v1/teachers/me/day — current teacher's sessions (teacher only).
 * Same shape as GetTeachersMeDayController: resolves the teacher profile
 * for the current user and passes its id into TeachersService.myDay.
 */
export async function getTeachersMeDay(query: {
  date?: string;
  start_date?: string;
  end_date?: string;
}) {
  const currentUser: UserEntity = await requireRole("teacher");

  const teacherProfile = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, currentUser.id))
    .limit(1);

  if (teacherProfile.length === 0) {
    throw new NotFoundError("Teacher profile not found for current user");
  }

  return await teachersService.myDay({
    date: query.date,
    start_date: query.start_date,
    end_date: query.end_date,
    teacher_id: teacherProfile[0].id,
  });
}

/**
 * Client-facing alias (src/client/teachers.ts imports this name).
 */
export async function getTeacherMyDay(query: {
  date?: string;
  start_date?: string;
  end_date?: string;
}) {
  return await getTeachersMeDay(query);
}

/**
 * GET /v1/admin/teacher-sick-day-notices — admin only (ported inline from
 * GetTeacherSickDayNoticesController).
 */
export async function listTeacherSickDayNotices(query: { from?: string; to?: string } = {}) {
  await requireRole("administrator");

  const conditions = [];
  if (query.from) {
    conditions.push(gte(TeacherSickDayNoticeTable.notice_date, query.from));
  }
  if (query.to) {
    conditions.push(lte(TeacherSickDayNoticeTable.notice_date, query.to));
  }

  const rows = await db
    .select({
      id: TeacherSickDayNoticeTable.id,
      notice_date: TeacherSickDayNoticeTable.notice_date,
      note: TeacherSickDayNoticeTable.note,
      bulletin_id: TeacherSickDayNoticeTable.bulletin_id,
      created_at: TeacherSickDayNoticeTable.created_at,
      teacher_id: TeacherProfileTable.id,
      teacher_name: UserTable.name,
      site_id: TeacherSickDayNoticeTable.site_id,
      site_name: LocationTable.name,
      bulletin_title: BulletinTable.title,
    })
    .from(TeacherSickDayNoticeTable)
    .innerJoin(
      TeacherProfileTable,
      eq(TeacherSickDayNoticeTable.teacher_id, TeacherProfileTable.id),
    )
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .innerJoin(LocationTable, eq(TeacherSickDayNoticeTable.site_id, LocationTable.id))
    .leftJoin(BulletinTable, eq(TeacherSickDayNoticeTable.bulletin_id, BulletinTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      desc(TeacherSickDayNoticeTable.notice_date),
      desc(TeacherSickDayNoticeTable.created_at),
    );

  return { items: rows };
}

export type { AgeGroupSpecialty };
