import { Service } from "typedi";
import Container from "@/container";
import { eq, ilike, or, desc, asc, and, sql, isNull, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  TeacherProfileTable,
  UserTable,
  ScheduleTable,
  TeacherStudentTable,
  StudentTable,
  LocationTable,
  EnrollmentTable,
  AttendanceTable,
  type TeacherProfileEntity,
  type TeacherProfileInsert,
  type ScheduleEntity,
  type ScheduleInsert,
} from "@/db/schema";
import { AttendanceService, type SessionForDay } from "@/domains/attendance/services/AttendanceService";

export type AgeGroupSpecialty =
  | "infant"
  | "toddler"
  | "preschool"
  | "elementary"
  | "middle_school"
  | "high_school"
  | "young_adult"
  | "all_ages";

export interface ListTeachersQuery {
  search?: string;
  specialty?: AgeGroupSpecialty;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "created_at";
  order?: "asc" | "desc";
}

export interface CreateTeacherInput {
  user_id: string;
  primary_site_id?: string;
  bio?: string;
  photo_url?: string;
  qualifications?: string;
  credentials?: string;
  age_group_specialty?: AgeGroupSpecialty;
}

export interface UpdateTeacherInput {
  primary_site_id?: string;
  bio?: string;
  photo_url?: string;
  qualifications?: string;
  credentials?: string;
  age_group_specialty?: AgeGroupSpecialty;
}

export interface CreateScheduleInput {
  site_id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
}

export interface UpdateScheduleInput {
  site_id?: string;
  day_of_week_mask?: number;
  start_time?: string;
  end_time?: string;
  cycle_start_date?: string;
  cycle_end_date?: string;
  is_active?: boolean;
}

export interface TeacherWithUser extends TeacherProfileEntity {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
  };
  primarySite?: {
    id: string;
    name: string;
  } | null;
}

export interface TeacherDetails extends TeacherWithUser {
  schedules: Array<ScheduleEntity & { site: { id: string; name: string } }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    site: { id: string; name: string };
  }>;
}

@Service()
export class TeachersService {
  private attendanceService: AttendanceService;
  constructor() {
    this.attendanceService = Container.get(AttendanceService);
  }
  /**
   * List teachers with filtering and pagination
   */
  async index(query: ListTeachersQuery): Promise<{
    items: TeacherWithUser[];
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

    if (query.search) {
      conditions.push(
        or(
          ilike(UserTable.name, `%${query.search}%`),
          ilike(UserTable.email, `%${query.search}%`)
        )
      );
    }

    if (query.specialty) {
      conditions.push(eq(TeacherProfileTable.age_group_specialty, query.specialty));
    }

    if (query.site_id) {
      conditions.push(eq(TeacherProfileTable.primary_site_id, query.site_id));
    }

    if (query.is_active !== undefined) {
      conditions.push(eq(UserTable.is_active, query.is_active));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(TeacherProfileTable)
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Determine sort and order
    const sortColumn = query.sort === "created_at" ? TeacherProfileTable.created_at : UserTable.name;
    const orderFn = query.order === "desc" ? desc : asc;

    // Get paginated results with joins
    const results = await db
      .select({
        id: TeacherProfileTable.id,
        user_id: TeacherProfileTable.user_id,
        primary_site_id: TeacherProfileTable.primary_site_id,
        bio: TeacherProfileTable.bio,
        photo_url: TeacherProfileTable.photo_url,
        qualifications: TeacherProfileTable.qualifications,
        credentials: TeacherProfileTable.credentials,
        age_group_specialty: TeacherProfileTable.age_group_specialty,
        created_at: TeacherProfileTable.created_at,
        updated_at: TeacherProfileTable.updated_at,
        user_name: UserTable.name,
        user_email: UserTable.email,
        user_phone: UserTable.phone,
        user_is_active: UserTable.is_active,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
      })
      .from(TeacherProfileTable)
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .leftJoin(LocationTable, eq(TeacherProfileTable.primary_site_id, LocationTable.id))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    const items: TeacherWithUser[] = results.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      primary_site_id: row.primary_site_id,
      bio: row.bio,
      photo_url: row.photo_url,
      qualifications: row.qualifications,
      credentials: row.credentials,
      age_group_specialty: row.age_group_specialty,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone,
        is_active: row.user_is_active,
      },
      primarySite: row.site_id
        ? {
            id: row.site_id,
            name: row.site_name!,
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
   * Get teacher details with schedules and assigned students
   */
  async show(id: string): Promise<TeacherDetails | null> {
    // Get teacher profile with user and site
    const teacherResults = await db
      .select({
        id: TeacherProfileTable.id,
        user_id: TeacherProfileTable.user_id,
        primary_site_id: TeacherProfileTable.primary_site_id,
        bio: TeacherProfileTable.bio,
        photo_url: TeacherProfileTable.photo_url,
        qualifications: TeacherProfileTable.qualifications,
        credentials: TeacherProfileTable.credentials,
        age_group_specialty: TeacherProfileTable.age_group_specialty,
        created_at: TeacherProfileTable.created_at,
        updated_at: TeacherProfileTable.updated_at,
        user_name: UserTable.name,
        user_email: UserTable.email,
        user_phone: UserTable.phone,
        user_is_active: UserTable.is_active,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
      })
      .from(TeacherProfileTable)
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .leftJoin(LocationTable, eq(TeacherProfileTable.primary_site_id, LocationTable.id))
      .where(eq(TeacherProfileTable.id, id))
      .limit(1);

    if (teacherResults.length === 0) {
      return null;
    }

    const row = teacherResults[0]!;

    // Get schedules
    const scheduleResults = await db
      .select({
        id: ScheduleTable.id,
        teacher_id: ScheduleTable.teacher_id,
        site_id: ScheduleTable.site_id,
        day_of_week_mask: ScheduleTable.day_of_week_mask,
        start_time: ScheduleTable.start_time,
        end_time: ScheduleTable.end_time,
        cycle_start_date: ScheduleTable.cycle_start_date,
        cycle_end_date: ScheduleTable.cycle_end_date,
        is_active: ScheduleTable.is_active,
        created_at: ScheduleTable.created_at,
        updated_at: ScheduleTable.updated_at,
        schedule_site_id: LocationTable.id,
        schedule_site_name: LocationTable.name,
      })
      .from(ScheduleTable)
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .where(eq(ScheduleTable.teacher_id, id));

    const schedules = scheduleResults.map((s) => ({
      id: s.id,
      teacher_id: s.teacher_id,
      site_id: s.site_id,
      day_of_week_mask: s.day_of_week_mask,
      start_time: s.start_time,
      end_time: s.end_time,
      cycle_start_date: s.cycle_start_date,
      cycle_end_date: s.cycle_end_date,
      is_active: s.is_active,
      created_at: s.created_at,
      updated_at: s.updated_at,
      site: {
        id: s.schedule_site_id,
        name: s.schedule_site_name,
      },
    }));

    // Get assigned students (active assignments only)
    const studentResults = await db
      .select({
        id: StudentTable.id,
        first_name: StudentTable.first_name,
        last_name: StudentTable.last_name,
        initials: StudentTable.initials,
        student_site_id: LocationTable.id,
        student_site_name: LocationTable.name,
      })
      .from(TeacherStudentTable)
      .innerJoin(StudentTable, eq(TeacherStudentTable.student_id, StudentTable.id))
      .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
      .where(
        and(
          eq(TeacherStudentTable.teacher_id, id),
          isNull(TeacherStudentTable.unassigned_at)
        )
      );

    const students = studentResults.map((s) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      initials: s.initials,
      site: {
        id: s.student_site_id,
        name: s.student_site_name,
      },
    }));

    return {
      id: row.id,
      user_id: row.user_id,
      primary_site_id: row.primary_site_id,
      bio: row.bio,
      photo_url: row.photo_url,
      qualifications: row.qualifications,
      credentials: row.credentials,
      age_group_specialty: row.age_group_specialty,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone,
        is_active: row.user_is_active,
      },
      primarySite: row.site_id
        ? {
            id: row.site_id,
            name: row.site_name!,
          }
        : null,
      schedules,
      students,
    };
  }

  /**
   * Create a new teacher profile
   */
  async create(input: CreateTeacherInput): Promise<TeacherProfileEntity> {
    // Check if teacher profile already exists for this user
    const existing = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, input.user_id))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Teacher profile already exists for this user");
    }

    // Verify user exists and is a teacher role
    const user = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, input.user_id))
      .limit(1);

    if (user.length === 0) {
      throw new Error("User not found");
    }

    if (user[0]!.role !== "teacher") {
      throw new Error("User must have teacher role");
    }

    const newTeacher: TeacherProfileInsert = {
      user_id: input.user_id,
      primary_site_id: input.primary_site_id || null,
      bio: input.bio || null,
      photo_url: input.photo_url || null,
      qualifications: input.qualifications || null,
      credentials: input.credentials || null,
      age_group_specialty: input.age_group_specialty || "all_ages",
    };

    const result = await db
      .insert(TeacherProfileTable)
      .values(newTeacher)
      .returning();

    return result[0]!;
  }

  /**
   * Update teacher profile
   */
  async update(id: string, input: UpdateTeacherInput): Promise<TeacherProfileEntity | null> {
    const existing = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.id, id))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const updateData: Partial<TeacherProfileInsert> = {
      updated_at: new Date(),
    };

    if (input.primary_site_id !== undefined) updateData.primary_site_id = input.primary_site_id;
    if (input.bio !== undefined) updateData.bio = input.bio;
    if (input.photo_url !== undefined) updateData.photo_url = input.photo_url;
    if (input.qualifications !== undefined) updateData.qualifications = input.qualifications;
    if (input.credentials !== undefined) updateData.credentials = input.credentials;
    if (input.age_group_specialty !== undefined) updateData.age_group_specialty = input.age_group_specialty;

    const result = await db
      .update(TeacherProfileTable)
      .set(updateData)
      .where(eq(TeacherProfileTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Get students assigned to a teacher
   */
  async students(id: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Count total
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(TeacherStudentTable)
      .where(
        and(
          eq(TeacherStudentTable.teacher_id, id),
          isNull(TeacherStudentTable.unassigned_at)
        )
      );

    const total = countResult[0]?.count || 0;

    // Get students
    const results = await db
      .select({
        id: StudentTable.id,
        first_name: StudentTable.first_name,
        last_name: StudentTable.last_name,
        initials: StudentTable.initials,
        dob: StudentTable.dob,
        is_active: StudentTable.is_active,
        assigned_at: TeacherStudentTable.assigned_at,
        site_id: LocationTable.id,
        site_name: LocationTable.name,
      })
      .from(TeacherStudentTable)
      .innerJoin(StudentTable, eq(TeacherStudentTable.student_id, StudentTable.id))
      .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
      .where(
        and(
          eq(TeacherStudentTable.teacher_id, id),
          isNull(TeacherStudentTable.unassigned_at)
        )
      )
      .orderBy(asc(StudentTable.last_name))
      .limit(limit)
      .offset(offset);

    const items = results.map((r) => ({
      id: r.id,
      initials: r.initials,
      dob: r.dob,
      is_active: r.is_active,
      assigned_at: r.assigned_at,
      site: {
        id: r.site_id,
        name: r.site_name,
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
   * Get today's sessions for a teacher (my-day)
   */
  async myDay(query: { date?: string; teacher_id?: string }): Promise<{ sessions: SessionForDay[] }> {
    const teacherId = query.teacher_id;
    if (!teacherId) {
      return { sessions: [] };
    }

    const date = query.date || new Date().toISOString().split("T")[0]!;
    const sessions = await this.attendanceService.getTeacherDaySessions(teacherId, date);
    
    return { sessions };
  }

  /**
   * Create a schedule for a teacher
   */
  async createSchedule(teacherId: string, input: CreateScheduleInput): Promise<ScheduleEntity> {
    // Verify teacher exists
    const teacher = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.id, teacherId))
      .limit(1);

    if (teacher.length === 0) {
      throw new Error("Teacher not found");
    }

    // Check for conflicts
    const conflicts = await this.checkScheduleConflicts(teacherId, input);
    if (conflicts.length > 0) {
      throw new Error(`Schedule conflicts with existing schedules: ${conflicts.map((c) => c.id).join(", ")}`);
    }

    const newSchedule: ScheduleInsert = {
      teacher_id: teacherId,
      site_id: input.site_id,
      day_of_week_mask: input.day_of_week_mask,
      start_time: input.start_time,
      end_time: input.end_time,
      cycle_start_date: input.cycle_start_date,
      cycle_end_date: input.cycle_end_date,
      is_active: true,
    };

    const result = await db.insert(ScheduleTable).values(newSchedule).returning();

    return result[0]!;
  }

  /**
   * Update a schedule
   */
  async updateSchedule(scheduleId: string, input: UpdateScheduleInput): Promise<ScheduleEntity | null> {
    const existing = await db
      .select()
      .from(ScheduleTable)
      .where(eq(ScheduleTable.id, scheduleId))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    // If changing time/days, check for conflicts
    if (input.day_of_week_mask !== undefined || input.start_time !== undefined || input.end_time !== undefined) {
      const checkInput: CreateScheduleInput = {
        site_id: input.site_id ?? existing[0]!.site_id,
        day_of_week_mask: input.day_of_week_mask ?? existing[0]!.day_of_week_mask,
        start_time: input.start_time ?? existing[0]!.start_time,
        end_time: input.end_time ?? existing[0]!.end_time,
        cycle_start_date: input.cycle_start_date ?? existing[0]!.cycle_start_date,
        cycle_end_date: input.cycle_end_date ?? existing[0]!.cycle_end_date,
      };

      const conflicts = await this.checkScheduleConflicts(
        existing[0]!.teacher_id,
        checkInput,
        scheduleId
      );

      if (conflicts.length > 0) {
        throw new Error(`Schedule conflicts with existing schedules: ${conflicts.map((c) => c.id).join(", ")}`);
      }
    }

    const updateData: Partial<ScheduleInsert> = {
      updated_at: new Date(),
    };

    if (input.site_id !== undefined) updateData.site_id = input.site_id;
    if (input.day_of_week_mask !== undefined) updateData.day_of_week_mask = input.day_of_week_mask;
    if (input.start_time !== undefined) updateData.start_time = input.start_time;
    if (input.end_time !== undefined) updateData.end_time = input.end_time;
    if (input.cycle_start_date !== undefined) updateData.cycle_start_date = input.cycle_start_date;
    if (input.cycle_end_date !== undefined) updateData.cycle_end_date = input.cycle_end_date;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const result = await db
      .update(ScheduleTable)
      .set(updateData)
      .where(eq(ScheduleTable.id, scheduleId))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Check for schedule conflicts
   */
  private async checkScheduleConflicts(
    teacherId: string,
    input: CreateScheduleInput,
    excludeScheduleId?: string
  ): Promise<ScheduleEntity[]> {
    // Get all active schedules for this teacher
    const conditions = [
      eq(ScheduleTable.teacher_id, teacherId),
      eq(ScheduleTable.is_active, true),
    ];

    if (excludeScheduleId) {
      conditions.push(sql`${ScheduleTable.id} != ${excludeScheduleId}`);
    }

    const existingSchedules = await db
      .select()
      .from(ScheduleTable)
      .where(and(...conditions));

    const conflicts: ScheduleEntity[] = [];

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

      conflicts.push(schedule);
    }

    return conflicts;
  }
}
