import { Service } from "typedi";
import { eq, and, desc, sql, isNull, inArray, asc, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";
import {
  ScheduleChangeRequestTable,
  ScheduleChangeRequestEventTable,
  StudentTable,
  ScheduleTable,
  TeacherProfileTable,
  UserTable,
  LocationTable,
  EnrollmentTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  type ScheduleChangeRequestEntity,
  type ScheduleChangeRequestInsert,
} from "@/db/schema";

export type RequestStatus = "pending" | "negotiating" | "approved" | "denied" | "completed";

export interface CreateScheduleChangeInput {
  student_id: string;
  current_schedule_id: string;
  requested_schedule_id?: string;
  preferred_times?: string;
  flexibility_notes?: string;
  reason: string;
  requested_by: string;
}

export interface ScheduleInfo {
  id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  site: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
}

export interface ScheduleChangeRequestWithDetails extends ScheduleChangeRequestEntity {
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
  current_schedule?: ScheduleInfo;
  requested_schedule?: ScheduleInfo;
  requested_by_user?: {
    id: string;
    name: string;
  };
  reviewed_by_user?: {
    id: string;
    name: string;
  } | null;
  events?: Array<{
    id: string;
    event_type: string;
    from_status: string | null;
    to_status: string | null;
    notes: string | null;
    created_at: Date;
      actor_user: {
        id: string;
        name: string;
        role: "administrator" | "teacher" | "parent" | "unassigned";
      };
  }>;
  preferred_times: string | null;
  flexibility_notes: string | null;
  teacher_response_status: string | null;
  teacher_response_notes: string | null;
  teacher_responded_by: string | null;
  teacher_responded_at: Date | null;
}

export interface TeacherScheduleChangeResponseInput {
  response_status: "available" | "unavailable" | "conditional";
  notes?: string;
}

interface ListRequestsFilters {
  status?: RequestStatus;
  student_id?: string;
  site_id?: string;
  page?: number;
  limit?: number;
  teacher_profile_id?: string;
  student_ids?: string[];
}

@Service()
export class ScheduleChangeService {
  private async getTeacherProfileId(teacherUserId: string): Promise<string | null> {
    const teacherProfile = await db
      .select({ id: TeacherProfileTable.id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, teacherUserId))
      .limit(1);

    return teacherProfile[0]?.id ?? null;
  }

  private async getParentStudentIds(parentUserId: string): Promise<string[]> {
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (parentProfile.length === 0) {
      return [];
    }

    const linkedStudents = await db
      .select({ student_id: ParentStudentLinkTable.student_id })
      .from(ParentStudentLinkTable)
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      );

    return linkedStudents.map((row) => row.student_id);
  }

  async isRequestVisibleToParent(requestId: string, parentUserId: string): Promise<boolean> {
    const studentIds = await this.getParentStudentIds(parentUserId);
    if (studentIds.length === 0) {
      return false;
    }

    const request = await db
      .select({ id: ScheduleChangeRequestTable.id })
      .from(ScheduleChangeRequestTable)
      .where(
        and(
          eq(ScheduleChangeRequestTable.id, requestId),
          inArray(ScheduleChangeRequestTable.student_id, studentIds),
        ),
      )
      .limit(1);

    return request.length > 0;
  }

  async isRequestVisibleToTeacher(requestId: string, teacherUserId: string): Promise<boolean> {
    const teacherProfileId = await this.getTeacherProfileId(teacherUserId);
    if (!teacherProfileId) {
      return false;
    }

    const requestedSchedule = alias(ScheduleTable, "requested_schedule");

    const request = await db
      .select({ id: ScheduleChangeRequestTable.id })
      .from(ScheduleChangeRequestTable)
      .leftJoin(ScheduleTable, eq(ScheduleChangeRequestTable.current_schedule_id, ScheduleTable.id))
      .leftJoin(
        requestedSchedule,
        eq(requestedSchedule.id, ScheduleChangeRequestTable.requested_schedule_id),
      )
      .where(
        and(
          eq(ScheduleChangeRequestTable.id, requestId),
          or(
            eq(ScheduleTable.teacher_id, teacherProfileId),
            eq(requestedSchedule.teacher_id, teacherProfileId),
          ),
        ),
      )
      .limit(1);

    return request.length > 0;
  }

  /**
   * Create a schedule change request (parent)
   */
  async createRequest(input: CreateScheduleChangeInput): Promise<ScheduleChangeRequestEntity> {
    // Verify student exists
    const student = await db
      .select()
      .from(StudentTable)
      .where(eq(StudentTable.id, input.student_id))
      .limit(1);

    if (student.length === 0) {
      throw new Error("Student not found");
    }

    // Verify current schedule exists
    const currentSchedule = await db
      .select()
      .from(ScheduleTable)
      .where(eq(ScheduleTable.id, input.current_schedule_id))
      .limit(1);

    if (currentSchedule.length === 0) {
      throw new Error("Current schedule not found");
    }

    if (input.requested_schedule_id) {
      const requestedSchedule = await db
        .select()
        .from(ScheduleTable)
        .where(eq(ScheduleTable.id, input.requested_schedule_id))
        .limit(1);

      if (requestedSchedule.length === 0) {
        throw new Error("Requested schedule not found");
      }
    }

    // Check for duplicate pending request
    const existing = await db
      .select()
      .from(ScheduleChangeRequestTable)
      .where(
        and(
          eq(ScheduleChangeRequestTable.student_id, input.student_id),
          eq(ScheduleChangeRequestTable.status, "pending"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("A pending schedule change request already exists for this student");
    }

    const newRequest: ScheduleChangeRequestInsert = {
      student_id: input.student_id,
      current_schedule_id: input.current_schedule_id,
      requested_schedule_id: input.requested_schedule_id || null,
      preferred_times: input.preferred_times || null,
      flexibility_notes: input.flexibility_notes || null,
      reason: input.reason,
      status: "pending",
      requested_by: input.requested_by,
      requested_at: new Date(),
    };

    const result = await db.insert(ScheduleChangeRequestTable).values(newRequest).returning();

    if (result[0]) {
      await db.insert(ScheduleChangeRequestEventTable).values({
        schedule_change_request_id: result[0].id,
        event_type: "created",
        from_status: null,
        to_status: "pending",
        actor_user_id: input.requested_by,
        notes: input.reason,
      });
    }

    return result[0]!;
  }

  private async getSchedulesInfoByIds(scheduleIds: string[]): Promise<Map<string, ScheduleInfo>> {
    const uniqueIds = Array.from(new Set(scheduleIds));
    const map = new Map<string, ScheduleInfo>();

    if (uniqueIds.length === 0) {
      return map;
    }

    const results = await db
      .select({
        id: ScheduleTable.id,
        day_of_week_mask: ScheduleTable.day_of_week_mask,
        start_time: ScheduleTable.start_time,
        end_time: ScheduleTable.end_time,
        cycle_start_date: ScheduleTable.cycle_start_date,
        cycle_end_date: ScheduleTable.cycle_end_date,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
        teacher_id: TeacherProfileTable.id,
        teacher_name: UserTable.name,
      })
      .from(ScheduleTable)
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(inArray(ScheduleTable.id, uniqueIds));

    for (const row of results) {
      map.set(row.id, {
        id: row.id,
        day_of_week_mask: row.day_of_week_mask,
        start_time: row.start_time,
        end_time: row.end_time,
        cycle_start_date: row.cycle_start_date,
        cycle_end_date: row.cycle_end_date,
        site: {
          id: row.site_id,
          name: row.site_name,
        },
        teacher: {
          id: row.teacher_id,
          name: row.teacher_name,
        },
      });
    }

    return map;
  }

  /**
   * List schedule change requests with filtering
   */
  async listRequests(
    filters: ListRequestsFilters,
  ): Promise<PaginatedResponse<ScheduleChangeRequestWithDetails>> {
    const { page, limit, offset } = getPagination(filters, 20, 100);
    const conditions: any[] = [];

    if (filters.status) {
      conditions.push(eq(ScheduleChangeRequestTable.status, filters.status));
    }

    if (filters.student_id) {
      conditions.push(eq(ScheduleChangeRequestTable.student_id, filters.student_id));
    }

    if (filters.site_id) {
      conditions.push(eq(ScheduleTable.site_id, filters.site_id));
    }

    if (filters.teacher_profile_id) {
      conditions.push(
        sql`(${ScheduleTable.teacher_id} = ${filters.teacher_profile_id} OR ${ScheduleChangeRequestTable.requested_schedule_id} IN (
          select id from schedules where teacher_id = ${filters.teacher_profile_id}
        ))`,
      );
    }

    if (filters.student_ids && filters.student_ids.length > 0) {
      conditions.push(inArray(ScheduleChangeRequestTable.student_id, filters.student_ids));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ScheduleChangeRequestTable)
      .innerJoin(ScheduleTable, eq(ScheduleChangeRequestTable.current_schedule_id, ScheduleTable.id))
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    const results = await db
      .select({
        id: ScheduleChangeRequestTable.id,
        student_id: ScheduleChangeRequestTable.student_id,
        current_schedule_id: ScheduleChangeRequestTable.current_schedule_id,
        requested_schedule_id: ScheduleChangeRequestTable.requested_schedule_id,
        preferred_times: ScheduleChangeRequestTable.preferred_times,
        flexibility_notes: ScheduleChangeRequestTable.flexibility_notes,
        teacher_response_status: ScheduleChangeRequestTable.teacher_response_status,
        teacher_response_notes: ScheduleChangeRequestTable.teacher_response_notes,
        teacher_responded_by: ScheduleChangeRequestTable.teacher_responded_by,
        teacher_responded_at: ScheduleChangeRequestTable.teacher_responded_at,
        reason: ScheduleChangeRequestTable.reason,
        status: ScheduleChangeRequestTable.status,
        requested_by: ScheduleChangeRequestTable.requested_by,
        requested_at: ScheduleChangeRequestTable.requested_at,
        reviewed_by: ScheduleChangeRequestTable.reviewed_by,
        reviewed_at: ScheduleChangeRequestTable.reviewed_at,
        review_notes: ScheduleChangeRequestTable.review_notes,
        created_at: ScheduleChangeRequestTable.created_at,
        updated_at: ScheduleChangeRequestTable.updated_at,
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
      })
      .from(ScheduleChangeRequestTable)
      .innerJoin(StudentTable, eq(ScheduleChangeRequestTable.student_id, StudentTable.id))
      .innerJoin(ScheduleTable, eq(ScheduleChangeRequestTable.current_schedule_id, ScheduleTable.id))
      .where(whereClause)
      .orderBy(desc(ScheduleChangeRequestTable.requested_at), desc(ScheduleChangeRequestTable.id))
      .limit(limit)
      .offset(offset);

    const scheduleIds = results.flatMap((row) =>
      row.requested_schedule_id ? [row.current_schedule_id, row.requested_schedule_id] : [row.current_schedule_id],
    );
    const scheduleMap = await this.getSchedulesInfoByIds(scheduleIds);

    const items: ScheduleChangeRequestWithDetails[] = results.map((row) => ({
        id: row.id,
        student_id: row.student_id,
        current_schedule_id: row.current_schedule_id,
        requested_schedule_id: row.requested_schedule_id,
        preferred_times: row.preferred_times,
        flexibility_notes: row.flexibility_notes,
        teacher_response_status: row.teacher_response_status,
        teacher_response_notes: row.teacher_response_notes,
        teacher_responded_by: row.teacher_responded_by,
        teacher_responded_at: row.teacher_responded_at,
        reason: row.reason,
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
        current_schedule: scheduleMap.get(row.current_schedule_id),
        requested_schedule: row.requested_schedule_id
          ? scheduleMap.get(row.requested_schedule_id)
          : undefined,
      }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  async listRequestsForTeacher(
    teacherUserId: string,
    filters: {
      status?: RequestStatus;
      student_id?: string;
      site_id?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResponse<ScheduleChangeRequestWithDetails>> {
    const teacherProfileId = await this.getTeacherProfileId(teacherUserId);
    if (!teacherProfileId) {
      const { page, limit } = getPagination(filters, 20, 100);
      return buildPaginatedResponse([], 0, page, limit);
    }

    return await this.listRequests({ ...filters, teacher_profile_id: teacherProfileId });
  }

  /**
   * Get schedule info with site and teacher
   */
  private async getScheduleInfo(scheduleId: string): Promise<ScheduleInfo | null> {
    const results = await db
      .select({
        id: ScheduleTable.id,
        day_of_week_mask: ScheduleTable.day_of_week_mask,
        start_time: ScheduleTable.start_time,
        end_time: ScheduleTable.end_time,
        cycle_start_date: ScheduleTable.cycle_start_date,
        cycle_end_date: ScheduleTable.cycle_end_date,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
        teacher_id: TeacherProfileTable.id,
        teacher_name: UserTable.name,
      })
      .from(ScheduleTable)
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(eq(ScheduleTable.id, scheduleId))
      .limit(1);

    if (results.length === 0) return null;

    const row = results[0]!;
    return {
      id: row.id,
      day_of_week_mask: row.day_of_week_mask,
      start_time: row.start_time,
      end_time: row.end_time,
      cycle_start_date: row.cycle_start_date,
      cycle_end_date: row.cycle_end_date,
      site: {
        id: row.site_id,
        name: row.site_name,
      },
      teacher: {
        id: row.teacher_id,
        name: row.teacher_name,
      },
    };
  }

  /**
   * Get a single request
   */
  async showRequest(id: string): Promise<ScheduleChangeRequestWithDetails | null> {
    const results = await db
      .select({
        id: ScheduleChangeRequestTable.id,
        student_id: ScheduleChangeRequestTable.student_id,
        current_schedule_id: ScheduleChangeRequestTable.current_schedule_id,
        requested_schedule_id: ScheduleChangeRequestTable.requested_schedule_id,
        preferred_times: ScheduleChangeRequestTable.preferred_times,
        flexibility_notes: ScheduleChangeRequestTable.flexibility_notes,
        teacher_response_status: ScheduleChangeRequestTable.teacher_response_status,
        teacher_response_notes: ScheduleChangeRequestTable.teacher_response_notes,
        teacher_responded_by: ScheduleChangeRequestTable.teacher_responded_by,
        teacher_responded_at: ScheduleChangeRequestTable.teacher_responded_at,
        reason: ScheduleChangeRequestTable.reason,
        status: ScheduleChangeRequestTable.status,
        requested_by: ScheduleChangeRequestTable.requested_by,
        requested_at: ScheduleChangeRequestTable.requested_at,
        reviewed_by: ScheduleChangeRequestTable.reviewed_by,
        reviewed_at: ScheduleChangeRequestTable.reviewed_at,
        review_notes: ScheduleChangeRequestTable.review_notes,
        created_at: ScheduleChangeRequestTable.created_at,
        updated_at: ScheduleChangeRequestTable.updated_at,
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
      })
      .from(ScheduleChangeRequestTable)
      .innerJoin(StudentTable, eq(ScheduleChangeRequestTable.student_id, StudentTable.id))
      .where(eq(ScheduleChangeRequestTable.id, id))
      .limit(1);

    if (results.length === 0) return null;

    const row = results[0]!;
    const currentSchedule = await this.getScheduleInfo(row.current_schedule_id);
    const requestedSchedule = row.requested_schedule_id
      ? await this.getScheduleInfo(row.requested_schedule_id)
      : null;

    const eventsRows = await db
      .select({
        id: ScheduleChangeRequestEventTable.id,
        event_type: ScheduleChangeRequestEventTable.event_type,
        from_status: ScheduleChangeRequestEventTable.from_status,
        to_status: ScheduleChangeRequestEventTable.to_status,
        notes: ScheduleChangeRequestEventTable.notes,
        created_at: ScheduleChangeRequestEventTable.created_at,
        actor_user_id: UserTable.id,
        actor_user_name: UserTable.name,
        actor_user_role: UserTable.role,
      })
      .from(ScheduleChangeRequestEventTable)
      .innerJoin(UserTable, eq(ScheduleChangeRequestEventTable.actor_user_id, UserTable.id))
      .where(eq(ScheduleChangeRequestEventTable.schedule_change_request_id, id))
      .orderBy(desc(ScheduleChangeRequestEventTable.created_at));

    return {
      id: row.id,
      student_id: row.student_id,
      current_schedule_id: row.current_schedule_id,
      requested_schedule_id: row.requested_schedule_id,
      preferred_times: row.preferred_times,
      flexibility_notes: row.flexibility_notes,
      teacher_response_status: row.teacher_response_status,
      teacher_response_notes: row.teacher_response_notes,
      teacher_responded_by: row.teacher_responded_by,
      teacher_responded_at: row.teacher_responded_at,
      reason: row.reason,
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
      current_schedule: currentSchedule || undefined,
      requested_schedule: requestedSchedule || undefined,
      events: eventsRows.map((event) => ({
        id: event.id,
        event_type: event.event_type,
        from_status: event.from_status,
        to_status: event.to_status,
        notes: event.notes,
        created_at: event.created_at,
        actor_user: {
          id: event.actor_user_id,
          name: event.actor_user_name,
          role: event.actor_user_role,
        },
      })),
    };
  }

  /**
   * Review a schedule change request (admin)
   */
  async reviewRequest(
    requestId: string,
    adminId: string,
    status: "approved" | "denied" | "negotiating",
    reviewNotes?: string,
  ): Promise<ScheduleChangeRequestEntity | null> {
    const existing = await db
      .select()
      .from(ScheduleChangeRequestTable)
      .where(eq(ScheduleChangeRequestTable.id, requestId))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const currentStatus = existing[0]!.status;
    const reviewableStatuses: RequestStatus[] = ["pending", "negotiating"];

    if (!reviewableStatuses.includes(currentStatus as RequestStatus)) {
      throw new Error("Request has already been finalized");
    }

    // If approved, update the enrollment when a concrete requested schedule is present
    if (status === "approved") {
      const request = existing[0]!;

      if (!request.requested_schedule_id) {
        throw new Error("Cannot approve without a requested schedule");
      }

      // End current enrollment
      await db
        .update(EnrollmentTable)
        .set({
          ended_at: new Date(),
          updated_at: new Date(),
        })
        .where(
          and(
            eq(EnrollmentTable.student_id, request.student_id),
            eq(EnrollmentTable.schedule_id, request.current_schedule_id),
            isNull(EnrollmentTable.ended_at),
          ),
        );

      // Create new enrollment
      await db.insert(EnrollmentTable).values({
        student_id: request.student_id,
        schedule_id: request.requested_schedule_id,
        enrolled_at: new Date(),
      });
    }

    const result = await db
      .update(ScheduleChangeRequestTable)
      .set({
        status,
        reviewed_by: adminId,
        reviewed_at: new Date(),
        review_notes: reviewNotes || null,
        updated_at: new Date(),
      })
      .where(eq(ScheduleChangeRequestTable.id, requestId))
      .returning();

    if (result[0]) {
      await db.insert(ScheduleChangeRequestEventTable).values({
        schedule_change_request_id: requestId,
        event_type: "status_change",
        from_status: currentStatus,
        to_status: status,
        actor_user_id: adminId,
        notes: reviewNotes || null,
      });
    }

    return result[0] ?? null;
  }

  async teacherRespond(
    requestId: string,
    teacherUserId: string,
    input: TeacherScheduleChangeResponseInput,
  ): Promise<ScheduleChangeRequestEntity | null> {
    const existing = await db
      .select()
      .from(ScheduleChangeRequestTable)
      .where(eq(ScheduleChangeRequestTable.id, requestId))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const request = existing[0]!;

    const teacherProfile = await db
      .select({ id: TeacherProfileTable.id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, teacherUserId))
      .limit(1);

    if (teacherProfile.length === 0) {
      throw new Error("Teacher profile not found");
    }

    const currentSchedule = await db
      .select({ teacher_id: ScheduleTable.teacher_id })
      .from(ScheduleTable)
      .where(eq(ScheduleTable.id, request.current_schedule_id))
      .limit(1);

    const requestedSchedule = request.requested_schedule_id
      ? await db
          .select({ teacher_id: ScheduleTable.teacher_id })
          .from(ScheduleTable)
          .where(eq(ScheduleTable.id, request.requested_schedule_id))
          .limit(1)
      : [];

    const teacherProfileId = teacherProfile[0]!.id;
    const canRespondCurrent = currentSchedule[0]?.teacher_id === teacherProfileId;
    const canRespondRequested = requestedSchedule[0]?.teacher_id === teacherProfileId;

    if (!canRespondCurrent && !canRespondRequested) {
      throw new Error("Teacher is not assigned to either schedule in this request");
    }

    const nextStatus: RequestStatus =
      request.status === "pending" ? "negotiating" : (request.status as RequestStatus);

    const result = await db
      .update(ScheduleChangeRequestTable)
      .set({
        status: nextStatus,
        teacher_response_status: input.response_status,
        teacher_response_notes: input.notes || null,
        teacher_responded_by: teacherUserId,
        teacher_responded_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(ScheduleChangeRequestTable.id, requestId))
      .returning();

    if (result[0]) {
      await db.insert(ScheduleChangeRequestEventTable).values({
        schedule_change_request_id: requestId,
        event_type: "teacher_response",
        from_status: request.status,
        to_status: nextStatus,
        actor_user_id: teacherUserId,
        notes: input.notes || input.response_status,
      });
    }

    return result[0] ?? null;
  }

  /**
   * Get requests for a parent's children
   */
  async listRequestsForParent(
    parentUserId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<ScheduleChangeRequestWithDetails>> {
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
