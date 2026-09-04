"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  TeacherLocationTable,
  TeacherProfileTable,
  TeacherSickDayNoticeTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { BulletinsService } from "@/server/bulletins/service";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";
import {
  type CreateScheduleInput,
  type CreateTeacherInput,
  TeachersService,
  type UpdateScheduleInput,
  type UpdateTeacherInput,
} from "@/server/teachers/service";

const createTeacherSchema = z
  .object({
    user_id: z.string().min(1),
    primary_site_id: z.string().nullable().optional(),
    bio: z.string().max(2000).nullable().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    qualifications: z.string().max(2000).nullable().optional(),
    credentials: z.string().max(2000).nullable().optional(),
    age_group_specialty: z
      .enum([
        "infant",
        "toddler",
        "preschool",
        "elementary",
        "middle_school",
        "high_school",
        "young_adult",
        "all_ages",
      ])
      .optional(),
  })
  .passthrough();

const updateTeacherSchema = z
  .object({
    primary_site_id: z.string().nullable().optional(),
    bio: z.string().max(2000).nullable().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    qualifications: z.string().max(2000).nullable().optional(),
    credentials: z.string().max(2000).nullable().optional(),
    age_group_specialty: z
      .enum([
        "infant",
        "toddler",
        "preschool",
        "elementary",
        "middle_school",
        "high_school",
        "young_adult",
        "all_ages",
      ])
      .optional(),
  })
  .passthrough();

const createScheduleSchema = z
  .object({
    site_id: z.string().min(1),
    session_id: z.string().optional(),
    day_of_week_mask: z.number().int().min(0),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cycle_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .passthrough();

const updateScheduleSchema = z
  .object({
    site_id: z.string().optional(),
    session_id: z.string().nullable().optional(),
    day_of_week_mask: z.number().int().min(0).optional(),
    start_time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional(),
    end_time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional(),
    cycle_start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    cycle_end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

const sickDaySchema = z
  .object({
    notice_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    note: z.string().max(2000).optional(),
    site_id: z.string().optional(),
  })
  .passthrough();

/**
 * POST /v1/teachers — create a teacher (admin only).
 */
export async function createTeacher(input: CreateTeacherInput) {
  await requireRole("administrator");
  const parsed = createTeacherSchema.parse(input) as CreateTeacherInput;
  return await new TeachersService().create(parsed);
}

/**
 * PATCH /v1/teachers/:id — update a teacher (admin only).
 */
export async function updateTeacher(id: string, input: UpdateTeacherInput) {
  await requireRole("administrator");
  const parsed = updateTeacherSchema.parse(input) as UpdateTeacherInput;
  const teacher = await new TeachersService().update(id, parsed);
  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }
  return teacher;
}

/**
 * POST /v1/teachers/:id/locations/:locationId — assign (admin only).
 */
export async function assignTeacherLocation(id: string, locationId: string) {
  await requireRole("administrator");
  await new TeachersService().assignTeacherToLocation(id, locationId);
  return { success: true };
}

/**
 * DELETE /v1/teachers/:id/locations/:locationId — unassign (admin only).
 */
export async function unassignTeacherLocation(id: string, locationId: string) {
  await requireRole("administrator");
  await new TeachersService().unassignTeacherFromLocation(id, locationId);
  return { success: true };
}

/**
 * POST /v1/teachers/:id/schedules — create a schedule (admin only).
 */
export async function createTeacherSchedule(id: string, input: CreateScheduleInput) {
  await requireRole("administrator");
  const parsed = createScheduleSchema.parse(input) as CreateScheduleInput;
  return await new TeachersService().createSchedule(id, parsed);
}

/**
 * PATCH /v1/schedules/:scheduleId — update a schedule (admin only).
 */
export async function updateSchedule(scheduleId: string, input: UpdateScheduleInput) {
  await requireRole("administrator");
  const parsed = updateScheduleSchema.parse(input) as UpdateScheduleInput;
  const schedule = await new TeachersService().updateSchedule(scheduleId, parsed);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }
  return schedule;
}

/**
 * POST /v1/teachers/me/sick-day — teacher sick-day notice (teacher only).
 * Ported from PostTeacherSickDayNoticeController (creates a site-scoped
 * bulletin for parents + a TeacherSickDayNotice row).
 */
export async function postTeacherSickDayNotice(input: {
  notice_date?: string;
  note?: string;
  site_id?: string;
}) {
  const currentUser = await requireRole("teacher");
  const parsed = sickDaySchema.parse(input);

  const teacherProfile = await db
    .select({ id: TeacherProfileTable.id, site_id: TeacherProfileTable.primary_site_id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, currentUser.id))
    .limit(1);

  if (teacherProfile.length === 0) {
    throw new BadRequestError("Teacher profile not found");
  }

  const noticeDate = parsed.notice_date || new Date().toISOString().split("T")[0];
  let siteId = parsed.site_id || teacherProfile[0].site_id;
  if (!siteId) {
    throw new BadRequestError("Teacher must have a primary site to create a sick-day notice");
  }

  if (parsed.site_id) {
    const assignedSite = await db
      .select({ id: TeacherLocationTable.id })
      .from(TeacherLocationTable)
      .where(
        and(
          eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0].id),
          eq(TeacherLocationTable.location_id, parsed.site_id),
        ),
      )
      .limit(1);

    if (assignedSite.length === 0 && teacherProfile[0].site_id !== parsed.site_id) {
      throw new BadRequestError("Teacher is not assigned to the selected site");
    }

    siteId = parsed.site_id;
  }

  const existingNotice = await db
    .select({ id: TeacherSickDayNoticeTable.id })
    .from(TeacherSickDayNoticeTable)
    .where(
      and(
        eq(TeacherSickDayNoticeTable.teacher_id, teacherProfile[0].id),
        eq(TeacherSickDayNoticeTable.notice_date, noticeDate),
      ),
    )
    .limit(1);

  if (existingNotice.length > 0) {
    throw new BadRequestError("Sick-day notice already exists for this date");
  }

  const teacherUser = await db
    .select({ name: UserTable.name })
    .from(UserTable)
    .where(eq(UserTable.id, currentUser.id))
    .limit(1);

  const title = `Teacher sick-day notice: ${teacherUser[0]?.name ?? "Teacher"} (${noticeDate})`;
  const bulletin = await new BulletinsService().create(
    {
      title,
      body:
        parsed.note?.trim() ||
        `Teacher is out sick on ${noticeDate}. Please watch for updates about session changes.`,
      scope: "site",
      site_id: siteId,
      role_target: "parent",
      requires_approval: false,
    },
    currentUser.id,
    "teacher",
  );

  const [notice] = await db
    .insert(TeacherSickDayNoticeTable)
    .values({
      teacher_id: teacherProfile[0].id,
      site_id: siteId,
      notice_date: noticeDate,
      note: parsed.note?.trim() || null,
      bulletin_id: bulletin.id,
      created_by: currentUser.id,
    })
    .returning();

  return notice;
}
