import { and, asc, desc, eq, gte, isNull, lte, ne, sql } from "drizzle-orm";
import {
  EnrollmentTable,
  LocationTable,
  type ScheduleEntity,
  ScheduleTable,
  SessionTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";

export interface ListSchedulesQuery {
  teacher_id?: string;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface AvailableSchedulesQuery {
  site_id?: string;
  day_of_week_mask?: number;
  day_pattern?: "mws" | "tths";
  exclude_current_schedule_id?: string;
  page?: number;
  limit?: number;
}

export interface ScheduleWithDetails extends ScheduleEntity {
  teacher: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  site: {
    id: string;
    name: string;
  };
  session?: {
    id: string;
    name: string;
  } | null;
}

export interface ScheduleDetails extends ScheduleWithDetails {
  enrolledStudents: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    enrolled_at: Date;
  }>;
}

export interface ConflictCheckInput {
  teacher_id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  exclude_schedule_id?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    id: string;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
  }>;
}

export class SchedulesService {
  /**
   * List schedules with filtering
   */
  async index(query: ListSchedulesQuery): Promise<{
    items: ScheduleWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

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

    // Count total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ScheduleTable)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get schedules with joins
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
        user: {
          id: r.user_id,
          name: r.user_name,
          email: r.user_email,
        },
      },
      site: {
        id: r.location_id,
        name: r.location_name,
      },
      session: r.session_id
        ? {
            id: r.session_id,
            name: r.session_name || "Session",
          }
        : null,
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
   * Get schedule details with enrolled students
   */
  async show(id: string): Promise<ScheduleDetails | null> {
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
      .where(eq(ScheduleTable.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const r = results[0]!;

    // Get enrolled students (active enrollments only)
    const enrollments = await db
      .select({
        student_id: StudentTable.id,
        first_name: StudentTable.first_name,
        last_name: StudentTable.last_name,
        initials: StudentTable.initials,
        enrolled_at: EnrollmentTable.enrolled_at,
      })
      .from(EnrollmentTable)
      .innerJoin(StudentTable, eq(EnrollmentTable.student_id, StudentTable.id))
      .where(and(eq(EnrollmentTable.schedule_id, id), isNull(EnrollmentTable.ended_at)))
      .orderBy(asc(StudentTable.last_name));

    const enrolledStudents = enrollments.map((e) => ({
      id: e.student_id,
      first_name: e.first_name,
      last_name: e.last_name,
      initials: e.initials,
      enrolled_at: e.enrolled_at,
    }));

    return {
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
        user: {
          id: r.user_id,
          name: r.user_name,
          email: r.user_email,
        },
      },
      site: {
        id: r.location_id,
        name: r.location_name,
      },
      session: r.session_id
        ? {
            id: r.session_id,
            name: r.session_name || "Session",
          }
        : null,
      enrolledStudents,
    };
  }

  /**
   * Get available schedules for parents to browse
   * Only returns active schedules within the current or upcoming cycle
   */
  async getAvailable(query: AvailableSchedulesQuery): Promise<{
    items: ScheduleWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    const today = new Date().toISOString().split("T")[0]!;

    const conditions = [
      eq(ScheduleTable.is_active, true),
      gte(ScheduleTable.cycle_end_date, today), // Only schedules that haven't ended yet
    ];

    if (query.site_id) {
      conditions.push(eq(ScheduleTable.site_id, query.site_id));
    }

    if (query.day_of_week_mask) {
      // Check if any days in the filter overlap with the schedule
      conditions.push(sql`(${ScheduleTable.day_of_week_mask} & ${query.day_of_week_mask}) > 0`);
    }

    if (query.day_pattern === "mws") {
      conditions.push(sql`(${ScheduleTable.day_of_week_mask} & 74) > 0`);
    } else if (query.day_pattern === "tths") {
      conditions.push(sql`(${ScheduleTable.day_of_week_mask} & 84) > 0`);
    }

    if (query.exclude_current_schedule_id) {
      conditions.push(ne(ScheduleTable.id, query.exclude_current_schedule_id));
    }

    const whereClause = and(...conditions);

    // Count total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ScheduleTable)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get schedules
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
      .orderBy(asc(ScheduleTable.start_time))
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
        user: {
          id: r.user_id,
          name: r.user_name,
          email: r.user_email,
        },
      },
      site: {
        id: r.location_id,
        name: r.location_name,
      },
      session: r.session_id
        ? {
            id: r.session_id,
            name: r.session_name || "Session",
          }
        : null,
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
   * Check for schedule conflicts for a teacher
   */
  async checkConflicts(input: ConflictCheckInput): Promise<ConflictResult> {
    const conditions = [
      eq(ScheduleTable.teacher_id, input.teacher_id),
      eq(ScheduleTable.is_active, true),
    ];

    if (input.exclude_schedule_id) {
      conditions.push(ne(ScheduleTable.id, input.exclude_schedule_id));
    }

    const existingSchedules = await db
      .select()
      .from(ScheduleTable)
      .where(and(...conditions));

    const conflicts: Array<{
      id: string;
      day_of_week_mask: number;
      start_time: string;
      end_time: string;
      cycle_start_date: string;
      cycle_end_date: string;
    }> = [];

    for (const schedule of existingSchedules) {
      // Check if day masks overlap
      const daysOverlap = (schedule.day_of_week_mask & input.day_of_week_mask) !== 0;
      if (!daysOverlap) continue;

      // Check if date ranges overlap
      const inputStart = new Date(input.cycle_start_date);
      const inputEnd = new Date(input.cycle_end_date);
      const schedStart = new Date(schedule.cycle_start_date);
      const schedEnd = new Date(schedule.cycle_end_date);

      const datesOverlap = inputStart <= schedEnd && inputEnd >= schedStart;
      if (!datesOverlap) continue;

      // Check if time ranges overlap
      const timesOverlap =
        input.start_time < schedule.end_time && input.end_time > schedule.start_time;
      if (!timesOverlap) continue;

      conflicts.push({
        id: schedule.id,
        day_of_week_mask: schedule.day_of_week_mask,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        cycle_start_date: schedule.cycle_start_date,
        cycle_end_date: schedule.cycle_end_date,
      });
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }
}
