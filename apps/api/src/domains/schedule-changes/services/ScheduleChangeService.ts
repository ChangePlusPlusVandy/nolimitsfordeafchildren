import { Service } from "typedi";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  ScheduleChangeRequestTable,
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

export type RequestStatus = "pending" | "approved" | "denied" | "completed";

export interface CreateScheduleChangeInput {
  student_id: string;
  current_schedule_id: string;
  requested_schedule_id: string;
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
}

@Service()
export class ScheduleChangeService {
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

    // Verify requested schedule exists
    const requestedSchedule = await db
      .select()
      .from(ScheduleTable)
      .where(eq(ScheduleTable.id, input.requested_schedule_id))
      .limit(1);

    if (requestedSchedule.length === 0) {
      throw new Error("Requested schedule not found");
    }

    // Check for duplicate pending request
    const existing = await db
      .select()
      .from(ScheduleChangeRequestTable)
      .where(
        and(
          eq(ScheduleChangeRequestTable.student_id, input.student_id),
          eq(ScheduleChangeRequestTable.status, "pending")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("A pending schedule change request already exists for this student");
    }

    const newRequest: ScheduleChangeRequestInsert = {
      student_id: input.student_id,
      current_schedule_id: input.current_schedule_id,
      requested_schedule_id: input.requested_schedule_id,
      reason: input.reason,
      status: "pending",
      requested_by: input.requested_by,
      requested_at: new Date(),
    };

    const result = await db
      .insert(ScheduleChangeRequestTable)
      .values(newRequest)
      .returning();

    return result[0]!;
  }

  /**
   * List schedule change requests with filtering
   */
  async listRequests(filters: {
    status?: RequestStatus;
    student_id?: string;
    site_id?: string;
    limit?: number;
  }): Promise<{ items: ScheduleChangeRequestWithDetails[] }> {
    // This is a complex query with multiple joins
    // We'll need to join the schedule table twice (current and requested)
    const results = await db
      .select({
        id: ScheduleChangeRequestTable.id,
        student_id: ScheduleChangeRequestTable.student_id,
        current_schedule_id: ScheduleChangeRequestTable.current_schedule_id,
        requested_schedule_id: ScheduleChangeRequestTable.requested_schedule_id,
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
      .orderBy(desc(ScheduleChangeRequestTable.requested_at))
      .limit(filters.limit || 50);

    // Fetch schedule details separately for simplicity
    const items: ScheduleChangeRequestWithDetails[] = [];

    for (const row of results) {
      // Skip if status filter doesn't match
      if (filters.status && row.status !== filters.status) continue;
      if (filters.student_id && row.student_id !== filters.student_id) continue;

      const currentSchedule = await this.getScheduleInfo(row.current_schedule_id);
      const requestedSchedule = await this.getScheduleInfo(row.requested_schedule_id);

      // Skip if site filter doesn't match
      if (filters.site_id && currentSchedule?.site.id !== filters.site_id) continue;

      items.push({
        id: row.id,
        student_id: row.student_id,
        current_schedule_id: row.current_schedule_id,
        requested_schedule_id: row.requested_schedule_id,
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
      });
    }

    return { items };
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
    const requestedSchedule = await this.getScheduleInfo(row.requested_schedule_id);

    return {
      id: row.id,
      student_id: row.student_id,
      current_schedule_id: row.current_schedule_id,
      requested_schedule_id: row.requested_schedule_id,
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
    };
  }

  /**
   * Review a schedule change request (admin)
   */
  async reviewRequest(
    requestId: string,
    adminId: string,
    status: "approved" | "denied",
    reviewNotes?: string
  ): Promise<ScheduleChangeRequestEntity | null> {
    const existing = await db
      .select()
      .from(ScheduleChangeRequestTable)
      .where(eq(ScheduleChangeRequestTable.id, requestId))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    if (existing[0]!.status !== "pending") {
      throw new Error("Request has already been reviewed");
    }

    // If approved, update the enrollment
    if (status === "approved") {
      const request = existing[0]!;

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
            isNull(EnrollmentTable.ended_at)
          )
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

    return result[0] ?? null;
  }

  /**
   * Get available schedules for a student to browse
   */
  async getAvailableSchedules(filters: {
    site_id?: string;
    day_pattern?: "mws" | "tths"; // Monday/Wed/Sat or Tue/Thu/Sat
    exclude_current_schedule_id?: string;
  }): Promise<{ items: ScheduleInfo[] }> {
    const today = new Date().toISOString().split("T")[0]!;

    const conditions: any[] = [
      eq(ScheduleTable.is_active, true),
      sql`${ScheduleTable.cycle_end_date} >= ${today}`,
    ];

    if (filters.site_id) {
      conditions.push(eq(ScheduleTable.site_id, filters.site_id));
    }

    if (filters.day_pattern === "mws") {
      // Mon=2, Wed=8, Sat=64 = 74
      conditions.push(sql`${ScheduleTable.day_of_week_mask} & 74 > 0`);
    } else if (filters.day_pattern === "tths") {
      // Tue=4, Thu=16, Sat=64 = 84
      conditions.push(sql`${ScheduleTable.day_of_week_mask} & 84 > 0`);
    }

    if (filters.exclude_current_schedule_id) {
      conditions.push(sql`${ScheduleTable.id} != ${filters.exclude_current_schedule_id}`);
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
      .where(and(...conditions))
      .orderBy(ScheduleTable.start_time);

    const items: ScheduleInfo[] = results.map((row) => ({
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
    }));

    return { items };
  }

  /**
   * Get requests for a parent's children
   */
  async listRequestsForParent(parentUserId: string): Promise<{ items: ScheduleChangeRequestWithDetails[] }> {
    // Get parent profile
    const parentProfile = await db
      .select()
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (parentProfile.length === 0) {
      return { items: [] };
    }

    // Get linked students
    const linkedStudents = await db
      .select({ student_id: ParentStudentLinkTable.student_id })
      .from(ParentStudentLinkTable)
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          isNull(ParentStudentLinkTable.revoked_at)
        )
      );

    if (linkedStudents.length === 0) {
      return { items: [] };
    }

    const studentIds = linkedStudents.map((s) => s.student_id);

    const results = await db
      .select({
        id: ScheduleChangeRequestTable.id,
        student_id: ScheduleChangeRequestTable.student_id,
        current_schedule_id: ScheduleChangeRequestTable.current_schedule_id,
        requested_schedule_id: ScheduleChangeRequestTable.requested_schedule_id,
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
      .where(sql`${ScheduleChangeRequestTable.student_id} IN ${studentIds}`)
      .orderBy(desc(ScheduleChangeRequestTable.requested_at));

    const items: ScheduleChangeRequestWithDetails[] = [];

    for (const row of results) {
      const currentSchedule = await this.getScheduleInfo(row.current_schedule_id);
      const requestedSchedule = await this.getScheduleInfo(row.requested_schedule_id);

      items.push({
        id: row.id,
        student_id: row.student_id,
        current_schedule_id: row.current_schedule_id,
        requested_schedule_id: row.requested_schedule_id,
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
      });
    }

    return { items };
  }
}
