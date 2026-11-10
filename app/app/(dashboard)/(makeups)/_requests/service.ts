import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getParentStudentIds } from "@/(dashboard)/(parents)/_domain/access";
import { db } from "@/_platform/db";
import {
  LocationTable,
  MakeupRequestTable,
  MakeupSessionTable,
  ScheduleTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
} from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type { ListMakeupRequestsFilters, MakeupRequestWithDetails } from "./types";

export class MakeupRequests {
  private async getParentStudentIds(parentUserId: string): Promise<string[]> {
    return getParentStudentIds(parentUserId);
  }

  async isRequestVisibleToParent(requestId: string, parentUserId: string): Promise<boolean> {
    const studentIds = await this.getParentStudentIds(parentUserId);
    if (studentIds.length === 0) {
      return false;
    }

    const request = await db
      .select({ id: MakeupRequestTable.id })
      .from(MakeupRequestTable)
      .where(
        and(
          eq(MakeupRequestTable.id, requestId),
          inArray(MakeupRequestTable.student_id, studentIds),
        ),
      )
      .limit(1);

    return request.length > 0;
  }

  async listRequests(
    filters: ListMakeupRequestsFilters,
  ): Promise<PaginatedResponse<MakeupRequestWithDetails>> {
    const { page, limit, offset } = getPagination(filters, 20, 100);
    // eslint-disable-next-line typescript/no-explicit-any -- drizzle where-condition array (ported legacy pattern)
    const conditions: any[] = [];

    if (filters.status) {
      conditions.push(eq(MakeupRequestTable.status, filters.status));
    }

    if (filters.student_id) {
      conditions.push(eq(MakeupRequestTable.student_id, filters.student_id));
    }

    if (filters.site_id) {
      conditions.push(eq(ScheduleTable.site_id, filters.site_id));
    }

    if (filters.student_ids && filters.student_ids.length > 0) {
      conditions.push(inArray(MakeupRequestTable.student_id, filters.student_ids));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(MakeupRequestTable)
      .innerJoin(ScheduleTable, eq(MakeupRequestTable.original_schedule_id, ScheduleTable.id))
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    const results = await db
      .select({
        id: MakeupRequestTable.id,
        student_id: MakeupRequestTable.student_id,
        original_session_date: MakeupRequestTable.original_session_date,
        original_schedule_id: MakeupRequestTable.original_schedule_id,
        reason: MakeupRequestTable.reason,
        reason_text: MakeupRequestTable.reason_text,
        preferred_dates: MakeupRequestTable.preferred_dates,
        status: MakeupRequestTable.status,
        requested_by: MakeupRequestTable.requested_by,
        requested_at: MakeupRequestTable.requested_at,
        reviewed_by: MakeupRequestTable.reviewed_by,
        reviewed_at: MakeupRequestTable.reviewed_at,
        review_notes: MakeupRequestTable.review_notes,
        created_at: MakeupRequestTable.created_at,
        updated_at: MakeupRequestTable.updated_at,
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
        site_name: LocationTable.name,
        teacher_name: UserTable.name,
      })
      .from(MakeupRequestTable)
      .innerJoin(StudentTable, eq(MakeupRequestTable.student_id, StudentTable.id))
      .innerJoin(ScheduleTable, eq(MakeupRequestTable.original_schedule_id, ScheduleTable.id))
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(whereClause)
      .orderBy(desc(MakeupRequestTable.requested_at))
      .limit(limit)
      .offset(offset);

    const requestIds = results.map((row) => row.id);
    const sessionsByRequestId = new Map<
      string,
      {
        id: string;
        scheduled_date: string;
        scheduled_time: string;
        teacher_name: string;
        site_name: string;
      }
    >();

    if (requestIds.length > 0) {
      const sessionRows = await db
        .select({
          id: MakeupSessionTable.id,
          makeup_request_id: MakeupSessionTable.makeup_request_id,
          scheduled_date: MakeupSessionTable.scheduled_date,
          scheduled_time: MakeupSessionTable.scheduled_time,
          teacher_name: UserTable.name,
          site_name: LocationTable.name,
          created_at: MakeupSessionTable.created_at,
        })
        .from(MakeupSessionTable)
        .innerJoin(TeacherProfileTable, eq(MakeupSessionTable.teacher_id, TeacherProfileTable.id))
        .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
        .innerJoin(LocationTable, eq(MakeupSessionTable.site_id, LocationTable.id))
        .where(inArray(MakeupSessionTable.makeup_request_id, requestIds))
        .orderBy(desc(MakeupSessionTable.created_at));

      for (const row of sessionRows) {
        if (!row.makeup_request_id || sessionsByRequestId.has(row.makeup_request_id)) {
          continue;
        }

        sessionsByRequestId.set(row.makeup_request_id, {
          id: row.id,
          scheduled_date: row.scheduled_date,
          scheduled_time: row.scheduled_time,
          teacher_name: row.teacher_name,
          site_name: row.site_name,
        });
      }
    }

    const items: MakeupRequestWithDetails[] = results.map((row) => ({
      id: row.id,
      student_id: row.student_id,
      original_session_date: row.original_session_date,
      original_schedule_id: row.original_schedule_id,
      reason: row.reason,
      reason_text: row.reason_text,
      preferred_dates: row.preferred_dates,
      status: row.status,
      requested_by: row.requested_by,
      requested_at: row.requested_at,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      review_notes: row.review_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      student: {
        id: row.student_id,
        initials: row.student_initials,
        first_name: row.student_first_name,
        last_name: row.student_last_name,
      },
      original_schedule: {
        id: row.original_schedule_id,
        site_name: row.site_name,
        teacher_name: row.teacher_name,
      },
      makeup_session: sessionsByRequestId.get(row.id) ?? null,
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  async showRequest(id: string): Promise<MakeupRequestWithDetails | null> {
    const results = await db
      .select({
        id: MakeupRequestTable.id,
        student_id: MakeupRequestTable.student_id,
        original_session_date: MakeupRequestTable.original_session_date,
        original_schedule_id: MakeupRequestTable.original_schedule_id,
        reason: MakeupRequestTable.reason,
        reason_text: MakeupRequestTable.reason_text,
        preferred_dates: MakeupRequestTable.preferred_dates,
        status: MakeupRequestTable.status,
        requested_by: MakeupRequestTable.requested_by,
        requested_at: MakeupRequestTable.requested_at,
        reviewed_by: MakeupRequestTable.reviewed_by,
        reviewed_at: MakeupRequestTable.reviewed_at,
        review_notes: MakeupRequestTable.review_notes,
        created_at: MakeupRequestTable.created_at,
        updated_at: MakeupRequestTable.updated_at,
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
        site_name: LocationTable.name,
        teacher_name: UserTable.name,
      })
      .from(MakeupRequestTable)
      .innerJoin(StudentTable, eq(MakeupRequestTable.student_id, StudentTable.id))
      .innerJoin(ScheduleTable, eq(MakeupRequestTable.original_schedule_id, ScheduleTable.id))
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(eq(MakeupRequestTable.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0]!;
    return {
      id: row.id,
      student_id: row.student_id,
      original_session_date: row.original_session_date,
      original_schedule_id: row.original_schedule_id,
      reason: row.reason,
      reason_text: row.reason_text,
      preferred_dates: row.preferred_dates,
      status: row.status,
      requested_by: row.requested_by,
      requested_at: row.requested_at,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      review_notes: row.review_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      student: {
        id: row.student_id,
        initials: row.student_initials,
        first_name: row.student_first_name,
        last_name: row.student_last_name,
      },
      original_schedule: {
        id: row.original_schedule_id,
        site_name: row.site_name,
        teacher_name: row.teacher_name,
      },
    };
  }

  async listRequestsForParent(
    parentUserId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<MakeupRequestWithDetails>> {
    const studentIds = await this.getParentStudentIds(parentUserId);
    if (studentIds.length === 0) {
      const { page, limit } = getPagination(query, 20, 100);
      return buildPaginatedResponse([], 0, page, limit);
    }

    return await this.listRequests({
      student_ids: studentIds,
      page: query.page,
      limit: query.limit,
    });
  }
}
