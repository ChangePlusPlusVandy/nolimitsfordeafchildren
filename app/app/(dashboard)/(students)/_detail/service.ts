import { and, desc, eq, isNull } from "drizzle-orm";

import { AttendanceService } from "@/(dashboard)/(attendance)/_domain/server";
import { db } from "@/_platform/db";
import {
  EnrollmentTable,
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  ScheduleTable,
  SessionTable,
  SiblingTable,
  StudentTable,
  TeacherProfileTable,
  TeacherStudentTable,
  UserTable,
} from "@/_platform/db/schema";

export class StudentDetailsService {
  private readonly attendanceService: AttendanceService;

  constructor() {
    this.attendanceService = new AttendanceService();
  }

  async show(
    id: string,
    user?: { id: string; role: "administrator" | "teacher" | "parent" | "unassigned" },
    // eslint-disable-next-line typescript/no-explicit-any -- preserve role-dependent detail contract
  ): Promise<any> {
    const [student] = await db.select().from(StudentTable).where(eq(StudentTable.id, id)).limit(1);

    if (!student) {
      return null;
    }

    const [site] = await db
      .select()
      .from(LocationTable)
      .where(eq(LocationTable.id, student.site_id))
      .limit(1);
    const siblings = await db.select().from(SiblingTable).where(eq(SiblingTable.student_id, id));
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
      site: site ? { id: site.id, name: site.name, type: site.type } : null,
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
          ? { id: schedule.session_id, name: schedule.session_name || "Session" }
          : null,
        site: { id: schedule.site_id, name: schedule.site_name },
        teacher: { id: schedule.teacher_id, name: schedule.teacher_name },
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
            ? { id: row.session_id, name: row.session_name || "Session" }
            : null,
          site: { id: row.site_id, name: row.site_name },
          teacher: { id: row.teacher_id, name: row.teacher_name },
        },
      })),
      attendance_overview: attendanceOverview,
    };
  }
}
