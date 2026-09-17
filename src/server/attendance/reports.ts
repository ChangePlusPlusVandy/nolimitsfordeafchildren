import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  type AttendanceEntity,
  AttendanceSiblingParticipantTable,
  AttendanceTable,
  LocationTable,
  ScheduleTable,
  SiblingTable,
  StudentTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import type {
  AttendanceSummary,
  ListAttendanceQuery,
  SiblingParticipationReportItem,
  StudentAttendanceOverview,
} from "@/server/attendance/types";

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

export async function getStudentAttendanceOverview(
  studentId: string,
  recentLimit = 5,
): Promise<StudentAttendanceOverview> {
  const summary = await getAttendanceSummary(studentId);

  const recentEntries = await db
    .select({
      id: AttendanceTable.id,
      session_date: AttendanceTable.session_date,
      status: AttendanceTable.status,
      late_minutes: AttendanceTable.late_minutes,
      reason: AttendanceTable.reason,
      reason_text: AttendanceTable.reason_text,
      marked_at: AttendanceTable.marked_at,
      schedule_id: AttendanceTable.schedule_id,
      marked_by_user_id: UserTable.id,
      marked_by_user_name: UserTable.name,
      marked_by_user_role: UserTable.role,
    })
    .from(AttendanceTable)
    .leftJoin(UserTable, eq(AttendanceTable.marked_by, UserTable.id))
    .where(eq(AttendanceTable.student_id, studentId))
    .orderBy(desc(AttendanceTable.session_date), desc(AttendanceTable.marked_at))
    .limit(recentLimit);

  return {
    ...summary,
    recent_entries: recentEntries.map((entry) => ({
      id: entry.id,
      session_date: entry.session_date,
      status: entry.status,
      late_minutes: entry.late_minutes,
      reason: entry.reason,
      reason_text: entry.reason_text,
      marked_at: entry.marked_at,
      schedule_id: entry.schedule_id,
      marked_by: entry.marked_by_user_id
        ? {
            id: entry.marked_by_user_id,
            name: entry.marked_by_user_name!,
            role: entry.marked_by_user_role!,
          }
        : null,
    })),
  };
}

export async function getSiblingParticipationReport(query: {
  date_from?: string;
  date_to?: string;
  site_id?: string;
}): Promise<{ items: SiblingParticipationReportItem[]; total: number }> {
  const conditions = [];
  if (query.date_from) {
    conditions.push(gte(AttendanceTable.session_date, query.date_from));
  }
  if (query.date_to) {
    conditions.push(lte(AttendanceTable.session_date, query.date_to));
  }
  if (query.site_id) {
    conditions.push(eq(ScheduleTable.site_id, query.site_id));
  }

  const rows = await db
    .select({
      sibling_id: SiblingTable.id,
      sibling_name: SiblingTable.name,
      student_id: StudentTable.id,
      student_initials: StudentTable.initials,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
      status: AttendanceTable.status,
    })
    .from(AttendanceSiblingParticipantTable)
    .innerJoin(
      AttendanceTable,
      eq(AttendanceSiblingParticipantTable.attendance_id, AttendanceTable.id),
    )
    .innerJoin(StudentTable, eq(AttendanceTable.student_id, StudentTable.id))
    .innerJoin(SiblingTable, eq(AttendanceSiblingParticipantTable.sibling_id, SiblingTable.id))
    .innerJoin(ScheduleTable, eq(AttendanceTable.schedule_id, ScheduleTable.id))
    .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(AttendanceTable.session_date));

  const grouped = new Map<string, SiblingParticipationReportItem>();
  for (const row of rows) {
    const key = `${row.sibling_id}:${row.student_id}:${row.site_id}`;
    const current = grouped.get(key) ?? {
      sibling_id: row.sibling_id,
      sibling_name: row.sibling_name,
      student_id: row.student_id,
      student_initials: row.student_initials,
      site_id: row.site_id,
      site_name: row.site_name,
      total_sessions: 0,
      present_sessions: 0,
    };

    current.total_sessions += 1;
    if (row.status === "present" || row.status === "late") {
      current.present_sessions += 1;
    }

    grouped.set(key, current);
  }

  const items = Array.from(grouped.values()).sort((a, b) => {
    if (a.site_name !== b.site_name) {
      return a.site_name.localeCompare(b.site_name);
    }
    if (a.student_initials !== b.student_initials) {
      return a.student_initials.localeCompare(b.student_initials);
    }
    return a.sibling_name.localeCompare(b.sibling_name);
  });

  return {
    items,
    total: items.length,
  };
}

export async function showAttendanceRecord(id: string): Promise<AttendanceEntity | null> {
  const result = await db.select().from(AttendanceTable).where(eq(AttendanceTable.id, id)).limit(1);

  return result[0] ?? null;
}
