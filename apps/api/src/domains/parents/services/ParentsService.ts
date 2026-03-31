import { Service } from "typedi";
import Container from "@/container";
import { eq, and, sql, desc, isNull, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  StudentTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  ScheduleTable,
  EnrollmentTable,
  AttendanceTable,
  LocationTable,
  TeacherProfileTable,
  UserTable,
  BulletinTable,
  DocumentTable,
  MakeupRequestTable,
  ScheduleChangeRequestTable,
} from "@/db/schema";
import { AttendanceService } from "@/domains/attendance/services/AttendanceService";

export interface LinkedChild {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  dob: string;
  site: {
    id: string;
    name: string;
  };
  current_schedule_id: string | null;
  next_session?: {
    date: string;
    time: string;
    teacher_name: string;
  } | null;
  attendance_summary: {
    total: number;
    present: number;
    attendance_rate: number;
  };
  pending_requests: number;
}

export interface ChildScheduleSession {
  schedule_id: string;
  date: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  teacher: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
  attendance_status?: "present" | "late" | "no_show" | "cancelled" | null;
}

export interface ChildDetails {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  dob: string;
  preferred_language: string;
  current_school: string | null;
  site: {
    id: string;
    name: string;
  };
  upcoming_sessions: ChildScheduleSession[];
  recent_sessions: ChildScheduleSession[];
  attendance_summary: {
    total: number;
    present: number;
    no_show: number;
    cancelled: number;
    attendance_rate: number;
  };
  pending_makeup_requests: number;
  pending_schedule_change_requests: number;
  missed_sessions: Array<{
    schedule_id: string;
    date: string;
    reason: string | null;
    can_request_makeup: boolean;
  }>;
  relevant_bulletins: Array<{
    id: string;
    title: string;
    body: string | null;
    publish_at: Date | null;
  }>;
  approved_documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    file_url: string;
    created_at: Date;
    review_status: "approved" | "pending" | "rejected";
    session_date: string | null;
  }>;
}

export interface DirectoryPerson {
  id: string;
  role: "administrator" | "teacher";
  name: string;
  email: string;
  bio: string | null;
  photo_url: string | null;
}

@Service()
export class ParentsService {
  private attendanceService: AttendanceService;
  constructor() {
    this.attendanceService = Container.get(AttendanceService);
  }

  async directory(parentUserId: string): Promise<{ items: DirectoryPerson[] }> {
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (parentProfile.length === 0) {
      return { items: [] };
    }

    const linkedSiteRows = await db
      .select({ site_id: StudentTable.site_id })
      .from(ParentStudentLinkTable)
      .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          isNull(ParentStudentLinkTable.revoked_at),
          eq(StudentTable.is_active, true),
        ),
      );

    const linkedSiteIds = Array.from(
      new Set(linkedSiteRows.map((row: { site_id: string }) => row.site_id)),
    );

    if (linkedSiteIds.length === 0) {
      return { items: [] };
    }

    const admins = await db
      .select({
        id: UserTable.id,
        role: UserTable.role,
        name: UserTable.name,
        email: UserTable.email,
        bio: sql<string | null>`NULL`,
        photo_url: sql<string | null>`NULL`,
      })
      .from(UserTable)
      .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)));

    const teachers = await db
      .select({
        id: UserTable.id,
        role: UserTable.role,
        name: UserTable.name,
        email: UserTable.email,
        bio: TeacherProfileTable.bio,
        photo_url: TeacherProfileTable.photo_url,
      })
      .from(TeacherProfileTable)
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(UserTable.role, "teacher"),
          eq(UserTable.is_active, true),
          sql`${TeacherProfileTable.primary_site_id} = ANY(${linkedSiteIds}::uuid[])`,
        ),
      );

    const combined = [...admins, ...teachers];

    const uniqueById = new Map<string, DirectoryPerson>();
    for (const person of combined) {
      if (person.role !== "administrator" && person.role !== "teacher") {
        continue;
      }

      uniqueById.set(person.id, {
        id: person.id,
        role: person.role,
        name: person.name,
        email: person.email,
        bio: person.bio,
        photo_url: person.photo_url,
      });
    }

    const items = Array.from(uniqueById.values()).sort((a, b) => a.name.localeCompare(b.name));

    return { items };
  }

  /**
   * Get all children linked to the current parent
   */
  async myChildren(parentUserId: string): Promise<{ items: LinkedChild[] }> {
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
      .select({
        student_id: StudentTable.id,
        first_name: StudentTable.first_name,
        last_name: StudentTable.last_name,
        initials: StudentTable.initials,
        dob: StudentTable.dob,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
      })
      .from(ParentStudentLinkTable)
      .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
      .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          isNull(ParentStudentLinkTable.revoked_at),
          eq(StudentTable.is_active, true),
        ),
      );

    const items: LinkedChild[] = [];

    for (const student of linkedStudents) {
      // Get attendance summary
      const summary = await this.attendanceService.getSummary(student.student_id);

      const currentScheduleId = await this.getCurrentScheduleId(student.student_id);

      // Get pending requests count
      const pendingMakeups = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(MakeupRequestTable)
        .where(
          and(
            eq(MakeupRequestTable.student_id, student.student_id),
            eq(MakeupRequestTable.status, "pending"),
          ),
        );

      const pendingScheduleChanges = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(ScheduleChangeRequestTable)
        .where(
          and(
            eq(ScheduleChangeRequestTable.student_id, student.student_id),
            eq(ScheduleChangeRequestTable.status, "pending"),
          ),
        );

      const pendingRequests =
        (pendingMakeups[0]?.count || 0) + (pendingScheduleChanges[0]?.count || 0);

      // Get next scheduled session
      const nextSession = await this.getNextSession(student.student_id);

      items.push({
        id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        initials: student.initials,
        dob: student.dob,
        site: {
          id: student.site_id,
          name: student.site_name,
        },
        current_schedule_id: currentScheduleId,
        next_session: nextSession,
        attendance_summary: {
          total: summary.total,
          present: summary.present,
          attendance_rate: summary.attendance_rate,
        },
        pending_requests: pendingRequests,
      });
    }

    return { items };
  }

  /**
   * Get detailed view of a child (for parent)
   */
  async childDetail(parentUserId: string, studentId: string): Promise<ChildDetails | null> {
    // Verify parent has access to this student
    const parentProfile = await db
      .select()
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (parentProfile.length === 0) {
      return null;
    }

    const link = await db
      .select()
      .from(ParentStudentLinkTable)
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
          eq(ParentStudentLinkTable.student_id, studentId),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      )
      .limit(1);

    if (link.length === 0) {
      return null; // Parent doesn't have access
    }

    // Get student details
    const student = await db
      .select({
        id: StudentTable.id,
        first_name: StudentTable.first_name,
        last_name: StudentTable.last_name,
        initials: StudentTable.initials,
        dob: StudentTable.dob,
        preferred_language: StudentTable.preferred_language,
        current_school: StudentTable.current_school,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
      })
      .from(StudentTable)
      .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
      .where(eq(StudentTable.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return null;
    }

    const s = student[0]!;

    // Get attendance summary
    const summary = await this.attendanceService.getSummary(studentId);

    // Get upcoming sessions (next 2 weeks)
    const upcomingSessions = await this.getScheduledSessions(studentId, 14, "future");

    // Get recent sessions (past 2 weeks)
    const recentSessions = await this.getScheduledSessions(studentId, 14, "past");

    // Get pending requests
    const pendingMakeups = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(MakeupRequestTable)
      .where(
        and(eq(MakeupRequestTable.student_id, studentId), eq(MakeupRequestTable.status, "pending")),
      );

    const pendingScheduleChanges = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ScheduleChangeRequestTable)
      .where(
        and(
          eq(ScheduleChangeRequestTable.student_id, studentId),
          eq(ScheduleChangeRequestTable.status, "pending"),
        ),
      );

    // Get missed sessions (no-shows without makeup request)
    const missedSessions = await this.getMissedSessions(studentId);

    // Get relevant bulletins
    const bulletins = await db
      .select({
        id: BulletinTable.id,
        title: BulletinTable.title,
        body: BulletinTable.body,
        publish_at: BulletinTable.publish_at,
      })
      .from(BulletinTable)
      .where(
        and(
          sql`(${BulletinTable.scope} = 'global' OR ${BulletinTable.site_id} = ${s.site_id})`,
          sql`(${BulletinTable.role_target} = 'all' OR ${BulletinTable.role_target} = 'parent')`,
          sql`(${BulletinTable.publish_at} IS NULL OR ${BulletinTable.publish_at} <= NOW())`,
          sql`(${BulletinTable.expire_at} IS NULL OR ${BulletinTable.expire_at} > NOW())`,
        ),
      )
      .orderBy(desc(BulletinTable.publish_at))
      .limit(5);

    const approvedDocuments = await db
      .select({
        id: DocumentTable.id,
        document_type: DocumentTable.document_type,
        file_name: DocumentTable.file_name,
        file_url: DocumentTable.file_url,
        created_at: DocumentTable.created_at,
        review_status: DocumentTable.review_status,
        session_date: DocumentTable.session_date,
      })
      .from(DocumentTable)
      .where(
        and(
          eq(DocumentTable.entity_type, "student"),
          eq(DocumentTable.entity_id, studentId),
          eq(DocumentTable.review_status, "approved"),
        ),
      )
      .orderBy(desc(DocumentTable.created_at))
      .limit(25);

    return {
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      initials: s.initials,
      dob: s.dob,
      preferred_language: s.preferred_language,
      current_school: s.current_school,
      site: {
        id: s.site_id,
        name: s.site_name,
      },
      upcoming_sessions: upcomingSessions,
      recent_sessions: recentSessions,
      attendance_summary: summary,
      pending_makeup_requests: pendingMakeups[0]?.count || 0,
      pending_schedule_change_requests: pendingScheduleChanges[0]?.count || 0,
      missed_sessions: missedSessions,
      relevant_bulletins: bulletins,
      approved_documents: approvedDocuments,
    };
  }

  /**
   * Get the currently active schedule for a student.
   * Uses latest active enrollment, if present.
   */
  private async getCurrentScheduleId(studentId: string): Promise<string | null> {
    const enrollment = await db
      .select({
        schedule_id: EnrollmentTable.schedule_id,
      })
      .from(EnrollmentTable)
      .where(and(eq(EnrollmentTable.student_id, studentId), isNull(EnrollmentTable.ended_at)))
      .orderBy(desc(EnrollmentTable.enrolled_at))
      .limit(1);

    return enrollment[0]?.schedule_id ?? null;
  }

  /**
   * Get next scheduled session for a student
   */
  private async getNextSession(studentId: string): Promise<LinkedChild["next_session"]> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]!;

    // Get active enrollments
    const enrollments = await db
      .select({
        schedule_id: ScheduleTable.id,
        day_of_week_mask: ScheduleTable.day_of_week_mask,
        start_time: ScheduleTable.start_time,
        cycle_start_date: ScheduleTable.cycle_start_date,
        cycle_end_date: ScheduleTable.cycle_end_date,
        teacher_user_id: UserTable.id,
        teacher_name: UserTable.name,
      })
      .from(EnrollmentTable)
      .innerJoin(ScheduleTable, eq(EnrollmentTable.schedule_id, ScheduleTable.id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(EnrollmentTable.student_id, studentId),
          isNull(EnrollmentTable.ended_at),
          eq(ScheduleTable.is_active, true),
          gte(ScheduleTable.cycle_end_date, todayStr),
        ),
      );

    if (enrollments.length === 0) {
      return null;
    }

    // Find next session date
    let nextDate: Date | null = null;
    let nextSchedule: (typeof enrollments)[0] | null = null;

    for (const enrollment of enrollments) {
      const scheduleStart = new Date(enrollment.cycle_start_date);
      const scheduleEnd = new Date(enrollment.cycle_end_date);

      // Start from today
      let checkDate = new Date(Math.max(today.getTime(), scheduleStart.getTime()));

      // Check next 30 days
      for (let i = 0; i < 30; i++) {
        if (checkDate > scheduleEnd) break;

        const dayMask = 1 << checkDate.getDay();
        if ((enrollment.day_of_week_mask & dayMask) !== 0) {
          if (!nextDate || checkDate < nextDate) {
            nextDate = checkDate;
            nextSchedule = enrollment;
          }
          break;
        }

        checkDate.setDate(checkDate.getDate() + 1);
      }
    }

    if (!nextDate || !nextSchedule) {
      return null;
    }

    return {
      date: nextDate.toISOString().split("T")[0]!,
      time: nextSchedule.start_time,
      teacher_name: nextSchedule.teacher_name,
    };
  }

  /**
   * Get scheduled sessions for a student
   */
  private async getScheduledSessions(
    studentId: string,
    daysRange: number,
    direction: "future" | "past",
  ): Promise<ChildScheduleSession[]> {
    const today = new Date();
    const rangeDate = new Date();

    if (direction === "future") {
      rangeDate.setDate(rangeDate.getDate() + daysRange);
    } else {
      rangeDate.setDate(rangeDate.getDate() - daysRange);
    }

    const startDate = direction === "future" ? today : rangeDate;
    const endDate = direction === "future" ? rangeDate : today;
    const startDateStr = startDate.toISOString().split("T")[0]!;
    const endDateStr = endDate.toISOString().split("T")[0]!;

    // Get enrollments
    const enrollments = await db
      .select({
        schedule_id: ScheduleTable.id,
        day_of_week_mask: ScheduleTable.day_of_week_mask,
        start_time: ScheduleTable.start_time,
        end_time: ScheduleTable.end_time,
        cycle_start_date: ScheduleTable.cycle_start_date,
        cycle_end_date: ScheduleTable.cycle_end_date,
        teacher_id: TeacherProfileTable.id,
        teacher_name: UserTable.name,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
      })
      .from(EnrollmentTable)
      .innerJoin(ScheduleTable, eq(EnrollmentTable.schedule_id, ScheduleTable.id))
      .innerJoin(TeacherProfileTable, eq(ScheduleTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .where(
        and(
          eq(EnrollmentTable.student_id, studentId),
          isNull(EnrollmentTable.ended_at),
          eq(ScheduleTable.is_active, true),
        ),
      );

    const sessions: ChildScheduleSession[] = [];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (const enrollment of enrollments) {
      const scheduleStart = new Date(enrollment.cycle_start_date);
      const scheduleEnd = new Date(enrollment.cycle_end_date);

      let checkDate = new Date(Math.max(startDate.getTime(), scheduleStart.getTime()));
      const finalDate = new Date(Math.min(endDate.getTime(), scheduleEnd.getTime()));

      while (checkDate <= finalDate) {
        const dayMask = 1 << checkDate.getDay();
        if ((enrollment.day_of_week_mask & dayMask) !== 0) {
          const dateStr = checkDate.toISOString().split("T")[0]!;

          // Get attendance for this session
          const attendance = await db
            .select()
            .from(AttendanceTable)
            .where(
              and(
                eq(AttendanceTable.student_id, studentId),
                eq(AttendanceTable.schedule_id, enrollment.schedule_id),
                eq(AttendanceTable.session_date, dateStr),
              ),
            )
            .limit(1);

          sessions.push({
            schedule_id: enrollment.schedule_id,
            date: dateStr,
            day_of_week: dayNames[checkDate.getDay()]!,
            start_time: enrollment.start_time,
            end_time: enrollment.end_time,
            teacher: {
              id: enrollment.teacher_id,
              name: enrollment.teacher_name,
            },
            site: {
              id: enrollment.site_id,
              name: enrollment.site_name,
            },
            attendance_status: attendance[0]?.status || null,
          });
        }

        checkDate.setDate(checkDate.getDate() + 1);
      }
    }

    // Sort by date
    sessions.sort((a, b) => {
      if (direction === "future") {
        return a.date.localeCompare(b.date);
      } else {
        return b.date.localeCompare(a.date);
      }
    });

    return sessions.slice(0, 10); // Limit to 10 sessions
  }

  /**
   * Get missed sessions that don't have a makeup request
   */
  private async getMissedSessions(studentId: string): Promise<ChildDetails["missed_sessions"]> {
    // Get no-show attendance records from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0]!;

    const noShows = await db
      .select({
        id: AttendanceTable.id,
        schedule_id: AttendanceTable.schedule_id,
        session_date: AttendanceTable.session_date,
        reason: AttendanceTable.reason,
      })
      .from(AttendanceTable)
      .where(
        and(
          eq(AttendanceTable.student_id, studentId),
          eq(AttendanceTable.status, "no_show"),
          gte(AttendanceTable.session_date, dateStr),
        ),
      )
      .orderBy(desc(AttendanceTable.session_date));

    const missed: ChildDetails["missed_sessions"] = [];

    for (const noShow of noShows) {
      // Check if there's already a makeup request for this session
      const existingRequest = await db
        .select({ id: MakeupRequestTable.id })
        .from(MakeupRequestTable)
        .where(
          and(
            eq(MakeupRequestTable.student_id, studentId),
            eq(MakeupRequestTable.original_schedule_id, noShow.schedule_id),
            eq(MakeupRequestTable.original_session_date, noShow.session_date),
          ),
        )
        .limit(1);

      missed.push({
        schedule_id: noShow.schedule_id,
        date: noShow.session_date,
        reason: noShow.reason,
        can_request_makeup: existingRequest.length === 0,
      });
    }

    return missed;
  }
}
