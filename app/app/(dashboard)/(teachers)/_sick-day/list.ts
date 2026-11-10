import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  BulletinTable,
  LocationTable,
  TeacherProfileTable,
  TeacherSickDayNoticeTable,
  UserTable,
} from "@/_platform/db/schema";

export async function listSickDayNotices(query: { from?: string; to?: string }) {
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
