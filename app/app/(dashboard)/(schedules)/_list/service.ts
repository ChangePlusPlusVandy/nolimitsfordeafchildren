import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  LocationTable,
  ScheduleTable,
  SessionTable,
  TeacherProfileTable,
  UserTable,
} from "@/_platform/db/schema";
import { buildPaginatedResponse, getPagination } from "@/_shared/server/pagination";

import type { ListSchedulesQuery, ScheduleWithDetails } from "../_domain/types";

export async function listSchedules(query: ListSchedulesQuery): Promise<{
  items: ScheduleWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { page, limit, offset } = getPagination(query, 20, 100);

  const conditions = [];

  if (query.teacher_id) {
    conditions.push(eq(ScheduleTable.teacher_id, query.teacher_id));
  }

  if (query.site_id) {
    conditions.push(eq(ScheduleTable.site_id, query.site_id));
  }

  if (query.is_active !== undefined) {
    conditions.push(eq(ScheduleTable.is_active, query.is_active));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(ScheduleTable)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

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
    .where(whereClause)
    .orderBy(desc(ScheduleTable.created_at))
    .limit(limit)
    .offset(offset);

  const items: ScheduleWithDetails[] = results.map((r) => ({
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
  }));

  return buildPaginatedResponse(items, total, page, limit);
}
