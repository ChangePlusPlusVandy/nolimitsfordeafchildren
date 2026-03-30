import { Service } from "typedi";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  MakeupRequestTable,
  MakeupSessionTable,
  StudentTable,
  ScheduleTable,
  TeacherProfileTable,
  UserTable,
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  type MakeupRequestEntity,
  type MakeupSessionEntity,
  type MakeupRequestInsert,
  type MakeupSessionInsert,
} from "@/db/schema";

export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";
export type RequestStatus = "pending" | "approved" | "denied" | "completed";
export type AttendanceStatus = "present" | "no_show" | "cancelled";

export interface CreateMakeupRequestInput {
  student_id: string;
  original_session_date: string;
  original_schedule_id: string;
  reason: AbsenceReason;
  reason_text?: string;
  preferred_dates?: string;
  requested_by: string;
}

export interface CreateMakeupSessionInput {
  makeup_request_id?: string;
  student_id: string;
  teacher_id: string;
  site_id: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
  created_by: string;
}

export interface MakeupRequestWithDetails extends MakeupRequestEntity {
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
  original_schedule?: {
    id: string;
    site_name: string;
    teacher_name: string;
  };
  requested_by_user?: {
    id: string;
    name: string;
  };
  reviewed_by_user?: {
    id: string;
    name: string;
  } | null;
}

export interface MakeupSessionWithDetails extends MakeupSessionEntity {
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
  site?: {
    id: string;
    name: string;
  };
}

@Service()
export class MakeupService {
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
      .select({ id: MakeupRequestTable.id })
      .from(MakeupRequestTable)
      .where(
        and(
          eq(MakeupRequestTable.id, requestId),
          sql`${MakeupRequestTable.student_id} IN ${studentIds}`,
        ),
      )
      .limit(1);

    return request.length > 0;
  }

  async isTeacherAuthorizedForSession(
    teacherUserId: string,
    teacherProfileId: string,
  ): Promise<boolean> {
    const profile = await db
      .select({ id: TeacherProfileTable.id })
      .from(TeacherProfileTable)
      .where(
        and(
          eq(TeacherProfileTable.id, teacherProfileId),
          eq(TeacherProfileTable.user_id, teacherUserId),
        ),
      )
      .limit(1);

    return profile.length > 0;
  }

  /**
   * Create a makeup request (parent)
   */
  async createRequest(input: CreateMakeupRequestInput): Promise<MakeupRequestEntity> {
    // Verify student exists
    const student = await db
      .select()
      .from(StudentTable)
      .where(eq(StudentTable.id, input.student_id))
      .limit(1);

    if (student.length === 0) {
      throw new Error("Student not found");
    }

    // Verify schedule exists
    const schedule = await db
      .select()
      .from(ScheduleTable)
      .where(eq(ScheduleTable.id, input.original_schedule_id))
      .limit(1);

    if (schedule.length === 0) {
      throw new Error("Schedule not found");
    }

    // Check for duplicate request
    const existing = await db
      .select()
      .from(MakeupRequestTable)
      .where(
        and(
          eq(MakeupRequestTable.student_id, input.student_id),
          eq(MakeupRequestTable.original_schedule_id, input.original_schedule_id),
          eq(MakeupRequestTable.original_session_date, input.original_session_date),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("A makeup request already exists for this session");
    }

    const newRequest: MakeupRequestInsert = {
      student_id: input.student_id,
      original_session_date: input.original_session_date,
      original_schedule_id: input.original_schedule_id,
      reason: input.reason,
      reason_text: input.reason_text || null,
      preferred_dates: input.preferred_dates || null,
      status: "pending",
      requested_by: input.requested_by,
      requested_at: new Date(),
    };

    const result = await db.insert(MakeupRequestTable).values(newRequest).returning();

    return result[0]!;
  }

  /**
   * List makeup requests with filtering
   */
  async listRequests(filters: {
    status?: RequestStatus;
    student_id?: string;
    site_id?: string;
    limit?: number;
  }): Promise<{ items: MakeupRequestWithDetails[] }> {
    // Build query with joins
    let query = db
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
      .orderBy(desc(MakeupRequestTable.requested_at))
      .limit(filters.limit || 50);

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

    const results = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

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
    }));

    return { items };
  }

  /**
   * Get a single makeup request
   */
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

  /**
   * Review a makeup request (admin)
   */
  async reviewRequest(
    requestId: string,
    adminId: string,
    status: "approved" | "denied",
    reviewNotes?: string,
  ): Promise<MakeupRequestEntity | null> {
    const existing = await db
      .select()
      .from(MakeupRequestTable)
      .where(eq(MakeupRequestTable.id, requestId))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    if (existing[0]!.status !== "pending") {
      throw new Error("Request has already been reviewed");
    }

    const result = await db
      .update(MakeupRequestTable)
      .set({
        status,
        reviewed_by: adminId,
        reviewed_at: new Date(),
        review_notes: reviewNotes || null,
        updated_at: new Date(),
      })
      .where(eq(MakeupRequestTable.id, requestId))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Create a makeup session
   */
  async createSession(input: CreateMakeupSessionInput): Promise<MakeupSessionEntity> {
    // Verify student exists
    const student = await db
      .select()
      .from(StudentTable)
      .where(eq(StudentTable.id, input.student_id))
      .limit(1);

    if (student.length === 0) {
      throw new Error("Student not found");
    }

    // Verify teacher exists
    const teacher = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.id, input.teacher_id))
      .limit(1);

    if (teacher.length === 0) {
      throw new Error("Teacher not found");
    }

    // Verify site exists
    const site = await db
      .select()
      .from(LocationTable)
      .where(eq(LocationTable.id, input.site_id))
      .limit(1);

    if (site.length === 0) {
      throw new Error("Site not found");
    }

    const newSession: MakeupSessionInsert = {
      makeup_request_id: input.makeup_request_id || null,
      student_id: input.student_id,
      teacher_id: input.teacher_id,
      site_id: input.site_id,
      scheduled_date: input.scheduled_date,
      scheduled_time: input.scheduled_time,
      notes: input.notes || null,
      created_by: input.created_by,
    };

    const result = await db.insert(MakeupSessionTable).values(newSession).returning();

    // If linked to a request, mark request as completed
    if (input.makeup_request_id) {
      await db
        .update(MakeupRequestTable)
        .set({
          status: "completed",
          updated_at: new Date(),
        })
        .where(eq(MakeupRequestTable.id, input.makeup_request_id));
    }

    return result[0]!;
  }

  /**
   * List makeup sessions for a teacher
   */
  async listSessionsForTeacher(
    teacherId: string,
    date?: string,
  ): Promise<{ items: MakeupSessionWithDetails[] }> {
    const conditions = [eq(MakeupSessionTable.teacher_id, teacherId)];

    if (date) {
      conditions.push(eq(MakeupSessionTable.scheduled_date, date));
    }

    const results = await db
      .select({
        id: MakeupSessionTable.id,
        makeup_request_id: MakeupSessionTable.makeup_request_id,
        student_id: MakeupSessionTable.student_id,
        teacher_id: MakeupSessionTable.teacher_id,
        site_id: MakeupSessionTable.site_id,
        scheduled_date: MakeupSessionTable.scheduled_date,
        scheduled_time: MakeupSessionTable.scheduled_time,
        attendance_status: MakeupSessionTable.attendance_status,
        notes: MakeupSessionTable.notes,
        created_by: MakeupSessionTable.created_by,
        created_at: MakeupSessionTable.created_at,
        updated_at: MakeupSessionTable.updated_at,
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
        site_name: LocationTable.name,
      })
      .from(MakeupSessionTable)
      .innerJoin(StudentTable, eq(MakeupSessionTable.student_id, StudentTable.id))
      .innerJoin(LocationTable, eq(MakeupSessionTable.site_id, LocationTable.id))
      .where(and(...conditions))
      .orderBy(MakeupSessionTable.scheduled_date, MakeupSessionTable.scheduled_time);

    const items: MakeupSessionWithDetails[] = results.map((row) => ({
      id: row.id,
      makeup_request_id: row.makeup_request_id,
      student_id: row.student_id,
      teacher_id: row.teacher_id,
      site_id: row.site_id,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      attendance_status: row.attendance_status,
      notes: row.notes,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      student: {
        id: row.student_id,
        initials: row.student_initials,
        first_name: row.student_first_name,
        last_name: row.student_last_name,
      },
      site: {
        id: row.site_id,
        name: row.site_name,
      },
    }));

    return { items };
  }

  /**
   * Mark attendance for a makeup session
   */
  async markSessionAttendance(
    sessionId: string,
    status: AttendanceStatus,
  ): Promise<MakeupSessionEntity | null> {
    const result = await db
      .update(MakeupSessionTable)
      .set({
        attendance_status: status,
        updated_at: new Date(),
      })
      .where(eq(MakeupSessionTable.id, sessionId))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Get requests for a parent's children
   */
  async listRequestsForParent(
    parentUserId: string,
  ): Promise<{ items: MakeupRequestWithDetails[] }> {
    const studentIds = await this.getParentStudentIds(parentUserId);
    if (studentIds.length === 0) {
      return { items: [] };
    }

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
      .where(sql`${MakeupRequestTable.student_id} IN ${studentIds}`)
      .orderBy(desc(MakeupRequestTable.requested_at));

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
    }));

    return { items };
  }
}
