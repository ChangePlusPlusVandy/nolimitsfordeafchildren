import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import {
  EnrollmentTable,
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  ScheduleTable,
  SessionTable,
  type SiblingEntity,
  SiblingTable,
  type StudentEntity,
  StudentTable,
  TeacherProfileTable,
  TeacherStudentTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { AttendanceService } from "@/server/attendance/service";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";

// Types
export type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

export interface StudentFilters {
  search?: string;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "initials" | "created_at" | "dob";
  order?: "asc" | "desc";
}

export interface CreateStudentInput {
  site_id: string;
  first_name: string;
  last_name: string;
  initials?: string;
  photo_url?: string;
  dob: string;
  current_school?: string;
  preferred_language?: string;
  hearing_devices?: string[];
  hearing_loss_type?:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary?: string;
}

export interface UpdateStudentInput {
  site_id?: string;
  first_name?: string;
  last_name?: string;
  initials?: string;
  photo_url?: string;
  dob?: string;
  current_school?: string;
  preferred_language?: string;
  hearing_devices?: string[];
  hearing_loss_type?:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary?: string;
  is_active?: boolean;
}

export interface AddSiblingInput {
  name: string;
  age?: number;
  relationship: string;
  is_participant?: boolean;
  has_hearing_loss?: boolean;
  photo_url?: string;
  notes?: string;
}

export interface UpdateSiblingInput {
  name?: string;
  age?: number;
  relationship?: string;
  is_participant?: boolean;
  has_hearing_loss?: boolean;
  photo_url?: string;
  notes?: string;
}

export interface LinkTeacherInput {
  teacher_id: string;
}

export interface LinkParentInput {
  parent_id: string;
  relationship?: string;
  is_primary?: boolean;
}

export class StudentsService {
  private readonly attendanceService: AttendanceService;

  constructor() {
    this.attendanceService = new AttendanceService();
  }

  private normalizeHearingDevices(input?: string[] | null): string[] {
    if (!input || input.length === 0) {
      return [];
    }

    return Array.from(
      new Set(input.map((value) => value.trim()).filter((value) => value.length > 0)),
    );
  }

  /**
   * List students with filtering and role-based scoping
   * - Admins see all students
   * - Teachers see only their assigned students
   * - Parents see only their linked children
   */
  async index(
    filters: StudentFilters,
    userRole: UserRole,
    userId?: string,
    // biome-ignore lint/suspicious/noExplicitAny: student list rows are shaped by caller-specific filters (ported legacy signature)
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, offset } = getPagination(filters, 20, 100);

    // Build base query conditions
    // biome-ignore lint/suspicious/noExplicitAny: drizzle where-condition array (ported legacy pattern)
    const conditions: any[] = [];

    // Apply search filter (on initials only for privacy in list view)
    if (filters.search) {
      const searchQuery = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          like(StudentTable.initials, searchQuery),
          like(StudentTable.first_name, searchQuery),
          like(StudentTable.last_name, searchQuery),
        ),
      );
    }

    // Apply site filter
    if (filters.site_id) {
      conditions.push(eq(StudentTable.site_id, filters.site_id));
    }

    // Apply active filter
    if (filters.is_active !== undefined) {
      conditions.push(eq(StudentTable.is_active, filters.is_active));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn =
      filters.sort === "created_at"
        ? StudentTable.created_at
        : filters.sort === "dob"
          ? StudentTable.dob
          : StudentTable.initials;

    const orderFn = filters.order === "desc" ? desc : asc;
    const secondarySort = filters.order === "desc" ? desc(StudentTable.id) : asc(StudentTable.id);

    let students: Array<
      Pick<
        StudentEntity,
        | "id"
        | "site_id"
        | "first_name"
        | "last_name"
        | "initials"
        | "photo_url"
        | "dob"
        | "current_school"
        | "preferred_language"
        | "guardian_summary"
        | "is_active"
        | "created_at"
        | "updated_at"
      >
    >;
    let total = 0;

    if (userRole === "administrator") {
      // Admins see all students
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(StudentTable)
        .where(whereClause);

      total = countResult[0]?.count ?? 0;

      students = await db
        .select()
        .from(StudentTable)
        .where(whereClause)
        .orderBy(orderFn(sortColumn), secondarySort)
        .limit(limit)
        .offset(offset);
    } else if (userRole === "teacher" && userId) {
      // Teachers see only assigned students
      const teacherProfile = await db
        .select()
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, userId))
        .limit(1);

      if (!teacherProfile.length) {
        return buildPaginatedResponse([], 0, page, limit);
      }

      const teacherProfileId = teacherProfile[0]!.id;

      const teacherScope = and(
        eq(TeacherStudentTable.teacher_id, teacherProfileId),
        isNull(TeacherStudentTable.unassigned_at),
      );
      const teacherWhereClause = whereClause ? and(teacherScope, whereClause) : teacherScope;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(StudentTable)
        .innerJoin(TeacherStudentTable, eq(TeacherStudentTable.student_id, StudentTable.id))
        .where(teacherWhereClause);

      total = countResult[0]?.count ?? 0;

      students = await db
        .select({
          id: StudentTable.id,
          site_id: StudentTable.site_id,
          first_name: StudentTable.first_name,
          last_name: StudentTable.last_name,
          initials: StudentTable.initials,
          photo_url: StudentTable.photo_url,
          dob: StudentTable.dob,
          current_school: StudentTable.current_school,
          preferred_language: StudentTable.preferred_language,
          guardian_summary: StudentTable.guardian_summary,
          is_active: StudentTable.is_active,
          created_at: StudentTable.created_at,
          updated_at: StudentTable.updated_at,
        })
        .from(StudentTable)
        .innerJoin(TeacherStudentTable, eq(TeacherStudentTable.student_id, StudentTable.id))
        .where(teacherWhereClause)
        .orderBy(orderFn(sortColumn), secondarySort)
        .limit(limit)
        .offset(offset);
    } else if (userRole === "parent" && userId) {
      // Parents see only their linked children
      const parentProfile = await db
        .select()
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, userId))
        .limit(1);

      if (!parentProfile.length) {
        return buildPaginatedResponse([], 0, page, limit);
      }

      const parentProfileId = parentProfile[0]!.id;

      const parentScope = and(
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        isNull(ParentStudentLinkTable.revoked_at),
      );
      const parentWhereClause = whereClause ? and(parentScope, whereClause) : parentScope;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(StudentTable)
        .innerJoin(ParentStudentLinkTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
        .where(parentWhereClause);

      total = countResult[0]?.count ?? 0;

      students = await db
        .select({
          id: StudentTable.id,
          site_id: StudentTable.site_id,
          first_name: StudentTable.first_name,
          last_name: StudentTable.last_name,
          initials: StudentTable.initials,
          photo_url: StudentTable.photo_url,
          dob: StudentTable.dob,
          current_school: StudentTable.current_school,
          preferred_language: StudentTable.preferred_language,
          guardian_summary: StudentTable.guardian_summary,
          is_active: StudentTable.is_active,
          created_at: StudentTable.created_at,
          updated_at: StudentTable.updated_at,
        })
        .from(StudentTable)
        .innerJoin(ParentStudentLinkTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
        .where(parentWhereClause)
        .orderBy(orderFn(sortColumn), secondarySort)
        .limit(limit)
        .offset(offset);
    } else {
      return buildPaginatedResponse([], 0, page, limit);
    }

    // For list views, show only initials (not full names) for PII protection
    const items = students.map((student) => ({
      id: student.id,
      initials: student.initials,
      site_id: student.site_id,
      dob: student.dob,
      is_active: student.is_active,
      // Only admins see full names in list view
      ...(userRole === "administrator" && {
        first_name: student.first_name,
        last_name: student.last_name,
      }),
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get student details with siblings, teachers, and parents
   */
  async show(
    id: string,
    user?: { id: string; role: "administrator" | "teacher" | "parent" | "unassigned" },
    // biome-ignore lint/suspicious/noExplicitAny: detail payload varies by role context (ported legacy signature)
  ): Promise<any> {
    // Get student
    const [student] = await db.select().from(StudentTable).where(eq(StudentTable.id, id)).limit(1);

    if (!student) {
      return null;
    }

    // Get site info
    const [site] = await db
      .select()
      .from(LocationTable)
      .where(eq(LocationTable.id, student.site_id))
      .limit(1);

    // Get siblings
    const siblings = await db.select().from(SiblingTable).where(eq(SiblingTable.student_id, id));

    // Get linked teachers (active only)
    const teacherLinks = await db
      .select({
        link_id: TeacherStudentTable.id,
        teacher_id: TeacherStudentTable.teacher_id,
        assigned_at: TeacherStudentTable.assigned_at,
        teacher_name: UserTable.name,
        teacher_email: UserTable.email,
        user_id: UserTable.id,
      })
      .from(TeacherStudentTable)
      .innerJoin(TeacherProfileTable, eq(TeacherStudentTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(eq(TeacherStudentTable.student_id, id), isNull(TeacherStudentTable.unassigned_at)),
      );

    // Get linked parents (active only)
    const parentLinks = await db
      .select({
        link_id: ParentStudentLinkTable.id,
        parent_id: ParentStudentLinkTable.parent_id,
        relationship: ParentStudentLinkTable.relationship,
        is_primary: ParentStudentLinkTable.is_primary,
        linked_at: ParentStudentLinkTable.linked_at,
        parent_name: UserTable.name,
        parent_email: UserTable.email,
        parent_phone: UserTable.phone,
        user_id: UserTable.id,
      })
      .from(ParentStudentLinkTable)
      .innerJoin(ParentProfileTable, eq(ParentStudentLinkTable.parent_id, ParentProfileTable.id))
      .innerJoin(UserTable, eq(ParentProfileTable.user_id, UserTable.id))
      .where(
        and(eq(ParentStudentLinkTable.student_id, id), isNull(ParentStudentLinkTable.revoked_at)),
      );

    const isTeacherLinked =
      user?.role === "teacher" && teacherLinks.some((t) => t.user_id === user.id);
    const isParentLinked =
      user?.role === "parent" && parentLinks.some((p) => p.user_id === user.id);

    if (user?.role === "teacher" && !isTeacherLinked) {
      return null;
    }

    if (user?.role === "parent" && !isParentLinked) {
      return null;
    }

    const activeSchedules = await db
      .select({
        id: ScheduleTable.id,
        day_of_week_mask: ScheduleTable.day_of_week_mask,
        start_time: ScheduleTable.start_time,
        end_time: ScheduleTable.end_time,
        cycle_start_date: ScheduleTable.cycle_start_date,
        cycle_end_date: ScheduleTable.cycle_end_date,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
        session_id: SessionTable.id,
        session_name: SessionTable.name,
        teacher_id: TeacherProfileTable.id,
        teacher_name: UserTable.name,
      })
      .from(EnrollmentTable)
      .innerJoin(ScheduleTable, eq(EnrollmentTable.schedule_id, ScheduleTable.id))
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .leftJoin(SessionTable, eq(ScheduleTable.session_id, SessionTable.id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(EnrollmentTable.student_id, id),
          isNull(EnrollmentTable.ended_at),
          eq(ScheduleTable.is_active, true),
        ),
      )
      .orderBy(desc(ScheduleTable.cycle_start_date), ScheduleTable.start_time);

    const scheduleHistoryRows = await db
      .select({
        enrollment_id: EnrollmentTable.id,
        enrolled_at: EnrollmentTable.enrolled_at,
        ended_at: EnrollmentTable.ended_at,
        schedule_id: ScheduleTable.id,
        day_of_week_mask: ScheduleTable.day_of_week_mask,
        start_time: ScheduleTable.start_time,
        end_time: ScheduleTable.end_time,
        cycle_start_date: ScheduleTable.cycle_start_date,
        cycle_end_date: ScheduleTable.cycle_end_date,
        schedule_is_active: ScheduleTable.is_active,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
        session_id: SessionTable.id,
        session_name: SessionTable.name,
        teacher_id: TeacherProfileTable.id,
        teacher_name: UserTable.name,
      })
      .from(EnrollmentTable)
      .innerJoin(ScheduleTable, eq(EnrollmentTable.schedule_id, ScheduleTable.id))
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .leftJoin(SessionTable, eq(ScheduleTable.session_id, SessionTable.id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(eq(EnrollmentTable.student_id, id))
      .orderBy(desc(EnrollmentTable.enrolled_at));

    let canViewAttendance = false;

    if (user?.role === "administrator") {
      canViewAttendance = true;
    } else if (user?.role === "teacher") {
      canViewAttendance = teacherLinks.some((t) => t.user_id === user.id);
    } else if (user?.role === "parent") {
      canViewAttendance = parentLinks.some((p) => p.user_id === user.id);
    }

    const attendanceOverview = canViewAttendance
      ? await this.attendanceService.getStudentAttendanceOverview(id, 5)
      : null;

    return {
      ...student,
      site: site
        ? {
            id: site.id,
            name: site.name,
            type: site.type,
          }
        : null,
      siblings: siblings.map((s) => ({
        id: s.id,
        name: s.name,
        age: s.age,
        relationship: s.relationship,
        is_participant: s.is_participant,
        has_hearing_loss: s.has_hearing_loss,
        photo_url: s.photo_url,
        notes: s.notes,
      })),
      teachers: teacherLinks.map((t) => ({
        link_id: t.link_id,
        teacher_id: t.teacher_id,
        name: t.teacher_name,
        email: t.teacher_email,
        assigned_at: t.assigned_at,
      })),
      parents: parentLinks.map((p) => ({
        link_id: p.link_id,
        parent_id: p.parent_id,
        user_id: p.user_id,
        name: p.parent_name,
        email: p.parent_email,
        phone: p.parent_phone,
        relationship: p.relationship,
        is_primary: p.is_primary,
        linked_at: p.linked_at,
      })),
      active_schedules: activeSchedules.map((schedule) => ({
        id: schedule.id,
        day_of_week_mask: schedule.day_of_week_mask,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        cycle_start_date: schedule.cycle_start_date,
        cycle_end_date: schedule.cycle_end_date,
        session: schedule.session_id
          ? {
              id: schedule.session_id,
              name: schedule.session_name || "Session",
            }
          : null,
        site: {
          id: schedule.site_id,
          name: schedule.site_name,
        },
        teacher: {
          id: schedule.teacher_id,
          name: schedule.teacher_name,
        },
      })),
      schedule_history: scheduleHistoryRows.map((row) => ({
        enrollment_id: row.enrollment_id,
        enrolled_at: row.enrolled_at,
        ended_at: row.ended_at,
        is_current: row.ended_at === null,
        schedule: {
          id: row.schedule_id,
          day_of_week_mask: row.day_of_week_mask,
          start_time: row.start_time,
          end_time: row.end_time,
          cycle_start_date: row.cycle_start_date,
          cycle_end_date: row.cycle_end_date,
          is_active: row.schedule_is_active,
          session: row.session_id
            ? {
                id: row.session_id,
                name: row.session_name || "Session",
              }
            : null,
          site: {
            id: row.site_id,
            name: row.site_name,
          },
          teacher: {
            id: row.teacher_id,
            name: row.teacher_name,
          },
        },
      })),
      attendance_overview: attendanceOverview,
    };
  }

  /**
   * Create a new student (admin only)
   */
  async create(data: CreateStudentInput): Promise<StudentEntity> {
    // Auto-generate initials if not provided
    const initials =
      data.initials || `${data.first_name.charAt(0)}${data.last_name.charAt(0)}`.toUpperCase();

    const [student] = await db
      .insert(StudentTable)
      .values({
        site_id: data.site_id,
        first_name: data.first_name,
        last_name: data.last_name,
        initials,
        photo_url: data.photo_url,
        dob: data.dob,
        current_school: data.current_school,
        preferred_language: data.preferred_language || "English",
        hearing_devices: this.normalizeHearingDevices(data.hearing_devices),
        hearing_loss_type: data.hearing_loss_type ?? null,
        guardian_summary: data.guardian_summary,
      })
      .returning();

    if (!student) {
      throw new Error("Failed to create student");
    }

    return student;
  }

  /**
   * Update a student (admin only)
   */
  async update(id: string, data: UpdateStudentInput): Promise<StudentEntity | null> {
    const updatePayload: Record<string, unknown> = {
      ...data,
      updated_at: new Date(),
    };

    if (data.hearing_devices !== undefined) {
      updatePayload.hearing_devices = this.normalizeHearingDevices(data.hearing_devices);
    }

    const [student] = await db
      .update(StudentTable)
      .set(updatePayload)
      .where(eq(StudentTable.id, id))
      .returning();

    return student || null;
  }

  async updateGuardianSummary(
    id: string,
    guardianSummary: string | null,
    user: { id: string; role: UserRole },
  ): Promise<StudentEntity | null> {
    const existingStudent = await db
      .select({ id: StudentTable.id })
      .from(StudentTable)
      .where(eq(StudentTable.id, id))
      .limit(1);

    if (existingStudent.length === 0) {
      return null;
    }

    if (user.role === "teacher") {
      const teacherProfile = await db
        .select({ id: TeacherProfileTable.id })
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, user.id))
        .limit(1);

      if (teacherProfile.length === 0) {
        throw new Error("Teacher profile not found");
      }

      const teacherLink = await db
        .select({ id: TeacherStudentTable.id })
        .from(TeacherStudentTable)
        .where(
          and(
            eq(TeacherStudentTable.student_id, id),
            eq(TeacherStudentTable.teacher_id, teacherProfile[0]!.id),
            isNull(TeacherStudentTable.unassigned_at),
          ),
        )
        .limit(1);

      if (teacherLink.length === 0) {
        throw new Error("You do not have permission to update this student's guardian summary");
      }
    }

    const [student] = await db
      .update(StudentTable)
      .set({
        guardian_summary: guardianSummary,
        updated_at: new Date(),
      })
      .where(eq(StudentTable.id, id))
      .returning();

    return student || null;
  }

  /**
   * Add a sibling to a student
   */
  async addSibling(studentId: string, data: AddSiblingInput): Promise<SiblingEntity> {
    const [sibling] = await db
      .insert(SiblingTable)
      .values({
        student_id: studentId,
        name: data.name,
        age: data.age,
        relationship: data.relationship,
        is_participant: data.is_participant ?? true,
        has_hearing_loss: data.has_hearing_loss ?? false,
        photo_url: data.photo_url,
        notes: data.notes,
      })
      .returning();

    if (!sibling) {
      throw new Error("Failed to create sibling");
    }

    return sibling;
  }

  /**
   * Update a sibling
   */
  async updateSibling(siblingId: string, data: UpdateSiblingInput): Promise<SiblingEntity | null> {
    const [sibling] = await db
      .update(SiblingTable)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(SiblingTable.id, siblingId))
      .returning();

    return sibling || null;
  }

  /**
   * Remove a sibling
   */
  async removeSibling(siblingId: string): Promise<{ ok: boolean }> {
    await db.delete(SiblingTable).where(eq(SiblingTable.id, siblingId));
    return { ok: true };
  }

  /**
   * Get student's teachers (existing method - updated)
   */
  async teachers(
    studentId: string,
    query: { page?: number; limit?: number },
    // biome-ignore lint/suspicious/noExplicitAny: joined teacher rows returned as paginated payload (ported legacy signature)
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, offset } = getPagination(query, 20, 100);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(TeacherStudentTable)
      .where(
        and(
          eq(TeacherStudentTable.student_id, studentId),
          isNull(TeacherStudentTable.unassigned_at),
        ),
      );

    const total = countResult[0]?.count ?? 0;

    const teacherLinks = await db
      .select({
        link_id: TeacherStudentTable.id,
        teacher_id: TeacherStudentTable.teacher_id,
        assigned_at: TeacherStudentTable.assigned_at,
        teacher_name: UserTable.name,
        teacher_email: UserTable.email,
      })
      .from(TeacherStudentTable)
      .innerJoin(TeacherProfileTable, eq(TeacherStudentTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(TeacherStudentTable.student_id, studentId),
          isNull(TeacherStudentTable.unassigned_at),
        ),
      )
      .orderBy(desc(TeacherStudentTable.assigned_at), desc(TeacherStudentTable.id))
      .limit(limit)
      .offset(offset);

    const items = teacherLinks.map((t) => ({
      link_id: t.link_id,
      teacher_id: t.teacher_id,
      name: t.teacher_name,
      email: t.teacher_email,
      assigned_at: t.assigned_at,
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Link a teacher to a student (admin only)
   */
  async linkTeacher(
    studentId: string,
    teacherId: string,
  ): Promise<{ ok: boolean; link_id: string }> {
    // Check if already linked
    const existing = await db
      .select()
      .from(TeacherStudentTable)
      .where(
        and(
          eq(TeacherStudentTable.student_id, studentId),
          eq(TeacherStudentTable.teacher_id, teacherId),
          isNull(TeacherStudentTable.unassigned_at),
        ),
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      return { ok: true, link_id: existing[0].id };
    }

    const [link] = await db
      .insert(TeacherStudentTable)
      .values({
        student_id: studentId,
        teacher_id: teacherId,
      })
      .returning();

    if (!link) {
      throw new Error("Failed to link teacher");
    }

    return { ok: true, link_id: link.id };
  }

  /**
   * Unlink a teacher from a student (admin only)
   * Soft delete by setting unassigned_at
   */
  async unlinkTeacher(studentId: string, teacherId: string): Promise<{ ok: boolean }> {
    await db
      .update(TeacherStudentTable)
      .set({ unassigned_at: new Date() })
      .where(
        and(
          eq(TeacherStudentTable.student_id, studentId),
          eq(TeacherStudentTable.teacher_id, teacherId),
          isNull(TeacherStudentTable.unassigned_at),
        ),
      );

    return { ok: true };
  }

  /**
   * Get student's parents (existing method - updated)
   */
  async parents(
    studentId: string,
    query: { page?: number; limit?: number } = {},
    // biome-ignore lint/suspicious/noExplicitAny: joined parent rows returned as paginated payload (ported legacy signature)
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, offset } = getPagination(query, 20, 100);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ParentStudentLinkTable)
      .where(
        and(
          eq(ParentStudentLinkTable.student_id, studentId),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      );

    const total = countResult[0]?.count ?? 0;

    const parentLinks = await db
      .select({
        link_id: ParentStudentLinkTable.id,
        parent_id: ParentStudentLinkTable.parent_id,
        relationship: ParentStudentLinkTable.relationship,
        is_primary: ParentStudentLinkTable.is_primary,
        linked_at: ParentStudentLinkTable.linked_at,
        parent_name: UserTable.name,
        parent_email: UserTable.email,
        parent_phone: UserTable.phone,
        user_id: UserTable.id,
      })
      .from(ParentStudentLinkTable)
      .innerJoin(ParentProfileTable, eq(ParentStudentLinkTable.parent_id, ParentProfileTable.id))
      .innerJoin(UserTable, eq(ParentProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(ParentStudentLinkTable.student_id, studentId),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      )
      .orderBy(desc(ParentStudentLinkTable.linked_at), desc(ParentStudentLinkTable.id))
      .limit(limit)
      .offset(offset);

    const items = parentLinks.map((p) => ({
      link_id: p.link_id,
      parent_id: p.parent_id,
      user_id: p.user_id,
      name: p.parent_name,
      email: p.parent_email,
      phone: p.parent_phone,
      relationship: p.relationship,
      is_primary: p.is_primary,
      linked_at: p.linked_at,
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Link a parent to a student (admin only)
   * @param studentId - The student's ID
   * @param parentUserId - The parent's USER ID (not parent_profile.id)
   * @param relationship - Relationship type (mother, father, guardian, etc.)
   * @param isPrimary - Whether this is the primary parent
   */
  async linkParent(
    studentId: string,
    parentUserId: string,
    relationship?: string,
    isPrimary?: boolean,
  ): Promise<{ ok: boolean; link_id: string }> {
    // Look up the parent profile for this user
    let parentProfileId: string;
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (!parentProfile || parentProfile.length === 0) {
      // Defensive: Create parent profile if missing (e.g., role was changed but profile wasn't created)
      const [newProfile] = await db
        .insert(ParentProfileTable)
        .values({ user_id: parentUserId })
        .returning({ id: ParentProfileTable.id });

      if (!newProfile) {
        throw new Error("Failed to create parent profile");
      }
      parentProfileId = newProfile.id;
    } else {
      parentProfileId = parentProfile[0]!.id;
    }

    // Check if already linked
    const existing = await db
      .select()
      .from(ParentStudentLinkTable)
      .where(
        and(
          eq(ParentStudentLinkTable.student_id, studentId),
          eq(ParentStudentLinkTable.parent_id, parentProfileId),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      return { ok: true, link_id: existing[0].id };
    }

    const [link] = await db
      .insert(ParentStudentLinkTable)
      .values({
        student_id: studentId,
        parent_id: parentProfileId,
        relationship,
        is_primary: isPrimary ?? false,
      })
      .returning();

    if (!link) {
      throw new Error("Failed to link parent");
    }

    return { ok: true, link_id: link.id };
  }

  /**
   * Unlink a parent from a student (admin only)
   * Soft delete by setting revoked_at
   * @param studentId - The student's ID
   * @param parentUserId - The parent's USER ID (not parent_profile.id)
   */
  async unlinkParent(studentId: string, parentUserId: string): Promise<{ ok: boolean }> {
    // Look up the parent profile for this user
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (!parentProfile || parentProfile.length === 0) {
      // No parent profile exists, nothing to unlink
      return { ok: true };
    }

    const parentProfileId = parentProfile[0]!.id;

    await db
      .update(ParentStudentLinkTable)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(ParentStudentLinkTable.student_id, studentId),
          eq(ParentStudentLinkTable.parent_id, parentProfileId),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      );

    return { ok: true };
  }

  // Legacy methods for backward compatibility
  async assignTeacher(
    studentId: string,
    body: { teacher_id: string },
  ): Promise<{ ok: boolean; link_id: string }> {
    return this.linkTeacher(studentId, body.teacher_id);
  }

  async unassignTeacher(studentId: string, teacherId: string): Promise<{ ok: boolean }> {
    return this.unlinkTeacher(studentId, teacherId);
  }

  async addParent(
    studentId: string,
    body: LinkParentInput,
  ): Promise<{ ok: boolean; link_id: string }> {
    return this.linkParent(studentId, body.parent_id, body.relationship, body.is_primary);
  }

  async removeParent(studentId: string, parentId: string): Promise<{ ok: boolean }> {
    return this.unlinkParent(studentId, parentId);
  }
}
