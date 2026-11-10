import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type AttendanceEntity,
  AttendanceTable,
  LocationTable,
  ScheduleTable,
  StudentTable,
} from "@/_platform/db/schema";

import type { AttendanceSummary, ListAttendanceQuery } from "../_domain/types";

export async function listAttendanceRecords(query: ListAttendanceQuery): Promise<{
  items: Array<
    AttendanceEntity & {
      student: { id: string; initials: string };
      schedule: { id: string; start_time: string; end_time: string };
      site: { id: string; name: string };
    }
  >;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.student_id) {
    conditions.push(eq(AttendanceTable.student_id, query.student_id));
  }

  if (query.schedule_id) {
    conditions.push(eq(AttendanceTable.schedule_id, query.schedule_id));
  }

  if (query.status) {
    conditions.push(eq(AttendanceTable.status, query.status));
  }

  if (query.date_from) {
    conditions.push(gte(AttendanceTable.session_date, query.date_from));
  }

  if (query.date_to) {
    conditions.push(lte(AttendanceTable.session_date, query.date_to));
  }

  if (query.teacher_id) {
    conditions.push(eq(ScheduleTable.teacher_id, query.teacher_id));
  }

  if (query.site_id) {
    conditions.push(eq(ScheduleTable.site_id, query.site_id));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(AttendanceTable)
    .innerJoin(ScheduleTable, eq(AttendanceTable.schedule_id, ScheduleTable.id))
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  const results = await db
    .select({
      id: AttendanceTable.id,
      student_id: AttendanceTable.student_id,
      schedule_id: AttendanceTable.schedule_id,
      session_date: AttendanceTable.session_date,
      status: AttendanceTable.status,
      late_minutes: AttendanceTable.late_minutes,
      reason: AttendanceTable.reason,
      reason_text: AttendanceTable.reason_text,
      marked_by: AttendanceTable.marked_by,
      marked_at: AttendanceTable.marked_at,
      created_at: AttendanceTable.created_at,
      updated_at: AttendanceTable.updated_at,
      student_initials: StudentTable.initials,
      student_first_name: StudentTable.first_name,
      student_last_name: StudentTable.last_name,
      schedule_start_time: ScheduleTable.start_time,
      schedule_end_time: ScheduleTable.end_time,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
    })
    .from(AttendanceTable)
    .innerJoin(StudentTable, eq(AttendanceTable.student_id, StudentTable.id))
    .innerJoin(ScheduleTable, eq(AttendanceTable.schedule_id, ScheduleTable.id))
    .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
    .where(whereClause)
    .orderBy(desc(AttendanceTable.session_date), desc(AttendanceTable.marked_at))
    .limit(limit)
    .offset(offset);

  const items = results.map((row) => ({
    id: row.id,
    student_id: row.student_id,
    schedule_id: row.schedule_id,
    session_date: row.session_date,
    status: row.status,
    late_minutes: row.late_minutes,
    reason: row.reason,
    reason_text: row.reason_text,
    marked_by: row.marked_by,
    marked_at: row.marked_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student: {
      id: row.student_id,
      initials: row.student_initials,
    },
    schedule: {
      id: row.schedule_id,
      start_time: row.schedule_start_time,
      end_time: row.schedule_end_time,
    },
    site: {
      id: row.site_id,
      name: row.site_name,
    },
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAttendanceSummary(studentId: string): Promise<AttendanceSummary> {
  const result = await db
    .select({
      status: AttendanceTable.status,
      count: sql<number>`count(*)`,
    })
    .from(AttendanceTable)
    .where(eq(AttendanceTable.student_id, studentId))
    .groupBy(AttendanceTable.status);

  let present = 0;
  let late = 0;
  let no_show = 0;
  let cancelled = 0;

  for (const row of result) {
    switch (row.status) {
      case "present":
        present = row.count;
        break;
      case "late":
        late = row.count;
        break;
      case "no_show":
        no_show = row.count;
        break;
      case "cancelled":
        cancelled = row.count;
        break;
    }
  }

  const total = present + late + no_show + cancelled;
  const attendance_rate =
    present + late + no_show > 0
      ? Math.round(((present + late) / (present + late + no_show)) * 100)
      : 0;

  return {
    total,
    present,
    late,
    no_show,
    cancelled,
    attendance_rate,
  };
}

export async function showAttendanceRecord(id: string): Promise<AttendanceEntity | null> {
  const result = await db.select().from(AttendanceTable).where(eq(AttendanceTable.id, id)).limit(1);

  return result[0] ?? null;
}
