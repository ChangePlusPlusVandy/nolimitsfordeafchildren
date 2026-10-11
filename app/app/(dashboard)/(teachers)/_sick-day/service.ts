import { and, eq } from "drizzle-orm";

import { bulletinsService } from "@/(dashboard)/(bulletins)/_domain/server";
import { db } from "@/_platform/db";
import {
  TeacherLocationTable,
  TeacherProfileTable,
  TeacherSickDayNoticeTable,
  UserTable,
  type UserEntity,
} from "@/_platform/db/schema";
import { todayStr } from "@/_shared/server/dates";
import { BadRequestError } from "@/_shared/server/errors";

export async function postSickDayNotice(
  currentUser: UserEntity,
  parsed: {
    notice_date?: string;
    note?: string;
    site_id?: string;
  },
) {
  const teacherProfile = await db
    .select({ id: TeacherProfileTable.id, site_id: TeacherProfileTable.primary_site_id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, currentUser.id))
    .limit(1);

  if (teacherProfile.length === 0) {
    throw new BadRequestError("Teacher profile not found");
  }

  const noticeDate = parsed.notice_date || todayStr();
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
  const bulletin = await bulletinsService.create(
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
