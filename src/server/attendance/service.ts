import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import {
  type AttendanceEntity,
  type AttendanceInsert,
  AttendanceSiblingParticipantTable,
  AttendanceTable,
  EnrollmentTable,
  LocationTable,
  ScheduleTable,
  SiblingTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { sendMissedSessionAlert } from "@/lib/email";

export type AttendanceStatus = "present" | "late" | "no_show" | "cancelled";
export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

export interface MarkAttendanceInput {
  student_id: string;
  schedule_id: string;
  session_date: string;
  status: AttendanceStatus;
  late_minutes?: number;
  reason?: AbsenceReason;
  reason_text?: string;
  sibling_participant_ids?: string[];
  marked_by: string;
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  late_minutes?: number | null;
  reason?: AbsenceReason | null;
  reason_text?: string | null;
  sibling_participant_ids?: string[];
}

export interface ListAttendanceQuery {
  student_id?: string;
  schedule_id?: string;
  teacher_id?: string;
  site_id?: string;
  date_from?: string;
  date_to?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  no_show: number;
  cancelled: number;
  attendance_rate: number;
}

export interface AttendanceRecentEntry {
  id: string;
  session_date: string;
  status: AttendanceStatus;
  late_minutes: number | null;
  reason: AbsenceReason | null;
  reason_text: string | null;
  marked_at: Date;
  schedule_id: string;
  marked_by: {
    id: string;
    name: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  } | null;
}

export interface StudentAttendanceOverview {
  total: number;
  present: number;
  late: number;
  no_show: number;
  cancelled: number;
  attendance_rate: number;
  recent_entries: AttendanceRecentEntry[];
}

export interface SessionForDay {
  session_date: string;
  schedule_id: string;
  student_id: string;
  student_initials: string;
  student_first_name: string;
  student_last_name: string;
  start_time: string;
  end_time: string;
  site_id: string;
  site_name: string;
  attendance?: {
    id: string;
    status: AttendanceStatus;
    late_minutes: number | null;
    reason: AbsenceReason | null;
    reason_text: string | null;
    marked_at: Date;
    sibling_participants?: Array<{
      sibling_id: string;
      name: string;
      relationship: string;
    }>;
  } | null;
}

export interface SiblingParticipationReportItem {
  sibling_id: string;
  sibling_name: string;
  student_id: string;
  student_initials: string;
  site_id: string;
  site_name: string;
  total_sessions: number;
  present_sessions: number;
}

export class AttendanceService {
  private normalizeSiblingParticipantIds(ids?: string[]): string[] {
    if (!ids || ids.length === 0) {
      return [];
    }

    return Array.from(new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)));
  }

  private async replaceSiblingParticipants(
    attendanceId: string,
    studentId: string,
    siblingIds: string[],
  ): Promise<void> {
    await db
      .delete(AttendanceSiblingParticipantTable)
      .where(eq(AttendanceSiblingParticipantTable.attendance_id, attendanceId));

    if (siblingIds.length === 0) {
      return;
    }

    const validSiblings = await db
      .select({ id: SiblingTable.id })
      .from(SiblingTable)
      .where(and(eq(SiblingTable.student_id, studentId), inArray(SiblingTable.id, siblingIds)));

    const validSiblingIds = validSiblings.map((s) => s.id);
    if (validSiblingIds.length === 0) {
      return;
    }

    await db.insert(AttendanceSiblingParticipantTable).values(
      validSiblingIds.map((siblingId) => ({
        attendance_id: attendanceId,
        sibling_id: siblingId,
      })),
    );
  }
  private async sendNoShowAlerts(params: {
    student_id: string;
    schedule_id: string;
    session_date: string;
    reason?: AbsenceReason;
  }): Promise<void> {
    const details = await db
      .select({
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
        student_initials: StudentTable.initials,
        teacher_name: UserTable.name,
        site_name: LocationTable.name,
      })
      .from(ScheduleTable)
      .innerJoin(StudentTable, eq(StudentTable.id, params.student_id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .where(eq(ScheduleTable.id, params.schedule_id))
      .limit(1);

    if (details.length === 0) {
      return;
    }

    const row = details[0]!;
    const studentName = `${row.student_first_name} ${row.student_last_name}`;

    const admins = await db
      .select({ email: UserTable.email })
      .from(UserTable)
      .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)));

    for (const admin of admins) {
      if (!admin.email) {
        continue;
      }

      await sendMissedSessionAlert(
        admin.email,
        studentName,
        row.student_initials,
        params.session_date,
        row.teacher_name,
        row.site_name,
        params.reason,
      );
    }
  }

  /**
   * Mark attendance for a student
   */
  async mark(input: MarkAttendanceInput): Promise<AttendanceEntity> {
    const siblingParticipantIds = this.normalizeSiblingParticipantIds(
      input.sibling_participant_ids,
    );

    if (input.status === "late") {
      if (![10, 15, 30].includes(input.late_minutes || 0)) {
        throw new Error("Late minutes must be one of: 10, 15, or 30");
      }
    }

    // Check if attendance already exists for this student/schedule/date
    const existing = await db
      .select()
      .from(AttendanceTable)
      .where(
        and(
          eq(AttendanceTable.student_id, input.student_id),
          eq(AttendanceTable.schedule_id, input.schedule_id),
          eq(AttendanceTable.session_date, input.session_date),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const shouldSendNoShowAlert = existing[0]!.status !== "no_show" && input.status === "no_show";

      // Update existing attendance record
      const result = await db
        .update(AttendanceTable)
        .set({
          status: input.status,
          late_minutes: input.status === "late" ? input.late_minutes || null : null,
          reason: input.reason || null,
          reason_text: input.reason_text || null,
          marked_by: input.marked_by,
          marked_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(AttendanceTable.id, existing[0]!.id))
        .returning();

      await this.replaceSiblingParticipants(result[0]!.id, input.student_id, siblingParticipantIds);

      if (shouldSendNoShowAlert) {
        await this.sendNoShowAlerts({
          student_id: input.student_id,
          schedule_id: input.schedule_id,
          session_date: input.session_date,
          reason: input.reason,
        });
      }

      return result[0]!;
    }

    // Create new attendance record
    const newAttendance: AttendanceInsert = {
      student_id: input.student_id,
      schedule_id: input.schedule_id,
      session_date: input.session_date,
      status: input.status,
      late_minutes: input.status === "late" ? input.late_minutes || null : null,
      reason: input.reason || null,
      reason_text: input.reason_text || null,
      marked_by: input.marked_by,
      marked_at: new Date(),
    };

    const result = await db.insert(AttendanceTable).values(newAttendance).returning();

    await this.replaceSiblingParticipants(result[0]!.id, input.student_id, siblingParticipantIds);

    if (input.status === "no_show") {
      await this.sendNoShowAlerts({
        student_id: input.student_id,
        schedule_id: input.schedule_id,
        session_date: input.session_date,
        reason: input.reason,
      });
    }

    return result[0]!;
  }

  /**
   * Update an existing attendance record
   */
  async update(
    id: string,
    input: UpdateAttendanceInput,
    markedBy: string,
  ): Promise<AttendanceEntity | null> {
    const existing = await db
      .select()
      .from(AttendanceTable)
      .where(eq(AttendanceTable.id, id))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    if (input.status === "late") {
      if (![10, 15, 30].includes(input.late_minutes || 0)) {
        throw new Error("Late minutes must be one of: 10, 15, or 30");
      }
    }

    const updateData: Partial<AttendanceInsert> = {
      updated_at: new Date(),
      marked_by: markedBy,
      marked_at: new Date(),
    };

    if (input.status !== undefined) updateData.status = input.status;
    if (input.late_minutes !== undefined) updateData.late_minutes = input.late_minutes;
    if (input.reason !== undefined) updateData.reason = input.reason;
    if (input.reason_text !== undefined) updateData.reason_text = input.reason_text;

    if (input.status && input.status !== "late" && input.late_minutes === undefined) {
      updateData.late_minutes = null;
    }

    const shouldSendNoShowAlert = existing[0]!.status !== "no_show" && input.status === "no_show";

    const result = await db
      .update(AttendanceTable)
      .set(updateData)
      .where(eq(AttendanceTable.id, id))
      .returning();

    if (input.sibling_participant_ids !== undefined) {
      const siblingParticipantIds = this.normalizeSiblingParticipantIds(
        input.sibling_participant_ids,
      );
      await this.replaceSiblingParticipants(id, existing[0]!.student_id, siblingParticipantIds);
    }

    if (shouldSendNoShowAlert) {
      await this.sendNoShowAlerts({
        student_id: existing[0]!.student_id,
        schedule_id: existing[0]!.schedule_id,
        session_date: existing[0]!.session_date,
        reason: (input.reason as AbsenceReason | null | undefined) ?? undefined,
      });
    }

    return result[0] ?? null;
  }

  /**
   * List attendance records with filtering
   */
  async index(query: ListAttendanceQuery): Promise<{
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

    // Build where conditions
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

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(AttendanceTable)
      .innerJoin(ScheduleTable, eq(AttendanceTable.schedule_id, ScheduleTable.id))
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get paginated results
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

  /**
   * Get attendance summary for a student
   */
  async getSummary(studentId: string): Promise<AttendanceSummary> {
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

  /**
   * Get attendance summary plus recent entries for a student
   */
  async getStudentAttendanceOverview(
    studentId: string,
    recentLimit = 5,
  ): Promise<StudentAttendanceOverview> {
    const summary = await this.getSummary(studentId);

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

  /**
   * Get sessions for a teacher's day (used by My Day page)
   */
  async getTeacherDaySessions(teacherProfileId: string, date: string): Promise<SessionForDay[]> {
    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    const dayMask = 1 << dayOfWeek; // Convert to bitmask

    // Find schedules for this teacher on this day
    const schedules = await db
      .select({
        schedule_id: ScheduleTable.id,
        start_time: ScheduleTable.start_time,
        end_time: ScheduleTable.end_time,
        day_of_week_mask: ScheduleTable.day_of_week_mask,
        cycle_start_date: ScheduleTable.cycle_start_date,
        cycle_end_date: ScheduleTable.cycle_end_date,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
      })
      .from(ScheduleTable)
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .where(
        and(
          eq(ScheduleTable.teacher_id, teacherProfileId),
          eq(ScheduleTable.is_active, true),
          lte(ScheduleTable.cycle_start_date, date),
          gte(ScheduleTable.cycle_end_date, date),
          // Check if day mask includes this day
          sql`(${ScheduleTable.day_of_week_mask} & ${dayMask}) != 0`,
        ),
      );

    if (schedules.length === 0) {
      return [];
    }

    // Get all enrolled students for these schedules
    const scheduleIds = schedules.map((s) => s.schedule_id);

    const enrollments = await db
      .select({
        schedule_id: EnrollmentTable.schedule_id,
        student_id: StudentTable.id,
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
      })
      .from(EnrollmentTable)
      .innerJoin(StudentTable, eq(EnrollmentTable.student_id, StudentTable.id))
      .where(
        and(
          inArray(EnrollmentTable.schedule_id, scheduleIds),
          isNull(EnrollmentTable.ended_at),
          eq(StudentTable.is_active, true),
        ),
      );

    // Get existing attendance for this date
    const existingAttendance = await db
      .select()
      .from(AttendanceTable)
      .where(
        and(
          inArray(AttendanceTable.schedule_id, scheduleIds),
          eq(AttendanceTable.session_date, date),
        ),
      );

    const existingAttendanceIds = existingAttendance.map((attendance) => attendance.id);
    const siblingParticipantsByAttendance = new Map<
      string,
      Array<{
        sibling_id: string;
        name: string;
        relationship: string;
      }>
    >();

    if (existingAttendanceIds.length > 0) {
      const siblingParticipants = await db
        .select({
          attendance_id: AttendanceSiblingParticipantTable.attendance_id,
          sibling_id: SiblingTable.id,
          name: SiblingTable.name,
          relationship: SiblingTable.relationship,
        })
        .from(AttendanceSiblingParticipantTable)
        .innerJoin(SiblingTable, eq(AttendanceSiblingParticipantTable.sibling_id, SiblingTable.id))
        .where(inArray(AttendanceSiblingParticipantTable.attendance_id, existingAttendanceIds));

      for (const siblingParticipant of siblingParticipants) {
        const list = siblingParticipantsByAttendance.get(siblingParticipant.attendance_id) ?? [];
        list.push({
          sibling_id: siblingParticipant.sibling_id,
          name: siblingParticipant.name,
          relationship: siblingParticipant.relationship,
        });
        siblingParticipantsByAttendance.set(siblingParticipant.attendance_id, list);
      }
    }

    // Build session list
    const sessions: SessionForDay[] = [];

    for (const enrollment of enrollments) {
      const schedule = schedules.find((s) => s.schedule_id === enrollment.schedule_id)!;
      const attendance = existingAttendance.find(
        (a) => a.student_id === enrollment.student_id && a.schedule_id === enrollment.schedule_id,
      );

      sessions.push({
        session_date: date,
        schedule_id: enrollment.schedule_id,
        student_id: enrollment.student_id,
        student_initials: enrollment.student_initials,
        student_first_name: enrollment.student_first_name,
        student_last_name: enrollment.student_last_name,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        site_id: schedule.site_id,
        site_name: schedule.site_name,
        attendance: attendance
          ? {
              id: attendance.id,
              status: attendance.status,
              late_minutes: attendance.late_minutes,
              reason: attendance.reason,
              reason_text: attendance.reason_text,
              marked_at: attendance.marked_at,
              sibling_participants: siblingParticipantsByAttendance.get(attendance.id) ?? [],
            }
          : null,
      });
    }

    // Sort by start time, then by student name
    sessions.sort((a, b) => {
      if (a.start_time !== b.start_time) {
        return a.start_time.localeCompare(b.start_time);
      }
      return a.student_last_name.localeCompare(b.student_last_name);
    });

    return sessions;
  }

  async getSiblingParticipationReport(query: {
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

  async getTeacherSessionsInRange(
    teacherProfileId: string,
    startDate: string,
    endDate: string,
  ): Promise<SessionForDay[]> {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Invalid date range");
    }

    if (start > end) {
      throw new Error("Start date must be before or equal to end date");
    }

    const sessions: SessionForDay[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const currentDate = cursor.toISOString().split("T")[0]!;
      const daySessions = await this.getTeacherDaySessions(teacherProfileId, currentDate);
      sessions.push(...daySessions);
      cursor.setDate(cursor.getDate() + 1);
    }

    sessions.sort((a, b) => {
      if (a.session_date !== b.session_date) {
        return a.session_date.localeCompare(b.session_date);
      }

      if (a.start_time !== b.start_time) {
        return a.start_time.localeCompare(b.start_time);
      }

      return a.student_last_name.localeCompare(b.student_last_name);
    });

    return sessions;
  }

  /**
   * Get a specific attendance record
   */
  async show(id: string): Promise<AttendanceEntity | null> {
    const result = await db
      .select()
      .from(AttendanceTable)
      .where(eq(AttendanceTable.id, id))
      .limit(1);

    return result[0] ?? null;
  }
}
