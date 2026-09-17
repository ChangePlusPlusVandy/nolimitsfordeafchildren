import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import {
  type AgeGroupSpecialty,
  LocationTable,
  type ScheduleEntity,
  ScheduleTable,
  SessionTable,
  StudentTable,
  type TeacherProfileEntity,
  type TeacherProfileInsert,
  TeacherProfileTable,
  TeacherStudentTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { AttendanceService, type SessionForDay } from "@/server/attendance/service";
import type { CreateScheduleInput, UpdateScheduleInput } from "@/server/schedules/service";
import { BadRequestError, ConflictError, NotFoundError } from "@/server/shared/errors";
import { buildPaginatedResponse, getPagination } from "@/server/shared/pagination";
import {
  assignTeacherToLocation,
  getTeacherLocations,
  isTeacherAssignedToLocation,
  unassignTeacherFromLocation,
} from "@/server/teachers/locations";
import { requireTeacherProfileId, resolveTeacherProfileId } from "@/server/teachers/resolve";

export type { AgeGroupSpecialty };
export type { CreateScheduleInput, UpdateScheduleInput };

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
  locations: Array<{
    id: string;
    name: string;
  }>;
  schedules: Array<ScheduleEntity & { site: { id: string; name: string } }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    site: { id: string; name: string };
  }>;
}

export class TeachersService {
  private attendanceService: AttendanceService;

  constructor() {
    this.attendanceService = new AttendanceService();
  }

  /** @see resolveTeacherProfileId */
  resolveTeacherProfileId = resolveTeacherProfileId;

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
    const { page, limit, offset } = getPagination(query, 20, 100);

    const conditions = [];

    if (query.search) {
      conditions.push(
        or(like(UserTable.name, `%${query.search}%`), like(UserTable.email, `%${query.search}%`)),
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

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(TeacherProfileTable)
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    const sortColumn =
      query.sort === "created_at" ? TeacherProfileTable.created_at : UserTable.name;
    const orderFn = query.order === "desc" ? desc : asc;

    const results = await db
      .select({
        id: TeacherProfileTable.id,
        user_id: TeacherProfileTable.user_id,
        primary_site_id: TeacherProfileTable.primary_site_id,
        bio: TeacherProfileTable.bio,
        photo_url: TeacherProfileTable.photo_url,
        user_photo_url: UserTable.photo_url,
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
      photo_url: row.photo_url || row.user_photo_url,
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

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get teacher details with schedules and assigned students.
   * `id` accepts teacher_profiles.id (canonical) or users.id.
   */
  async show(id: string): Promise<TeacherDetails | null> {
    const profileId = await resolveTeacherProfileId(id);
    if (!profileId) {
      return null;
    }

    const teacherResults = await db
      .select({
        id: TeacherProfileTable.id,
        user_id: TeacherProfileTable.user_id,
        primary_site_id: TeacherProfileTable.primary_site_id,
        bio: TeacherProfileTable.bio,
        photo_url: TeacherProfileTable.photo_url,
        user_photo_url: UserTable.photo_url,
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
      .where(eq(TeacherProfileTable.id, profileId))
      .limit(1);

    if (teacherResults.length === 0) {
      return null;
    }

    const row = teacherResults[0]!;

    const teacherLocations = await getTeacherLocations(profileId);

    const scheduleResults = await db
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
        schedule_site_id: LocationTable.id,
        schedule_site_name: LocationTable.name,
        session_name: SessionTable.name,
      })
      .from(ScheduleTable)
      .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
      .leftJoin(SessionTable, eq(ScheduleTable.session_id, SessionTable.id))
      .where(eq(ScheduleTable.teacher_id, profileId));

    const schedules = scheduleResults.map((s) => ({
      id: s.id,
      teacher_id: s.teacher_id,
      site_id: s.site_id,
      session_id: s.session_id,
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
      session: s.session_id
        ? {
            id: s.session_id,
            name: s.session_name || "Session",
          }
        : null,
    }));

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
          eq(TeacherStudentTable.teacher_id, profileId),
          isNull(TeacherStudentTable.unassigned_at),
        ),
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
      photo_url: row.photo_url || row.user_photo_url,
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
      locations: teacherLocations,
      schedules,
      students,
    };
  }

  getTeacherLocations = getTeacherLocations;
  assignTeacherToLocation = assignTeacherToLocation;
  unassignTeacherFromLocation = unassignTeacherFromLocation;
  isTeacherAssignedToLocation = isTeacherAssignedToLocation;

  /**
   * Create a new teacher profile
   */
  async create(input: CreateTeacherInput): Promise<TeacherProfileEntity> {
    const existing = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, input.user_id))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("Teacher profile already exists for this user");
    }

    const user = await db.select().from(UserTable).where(eq(UserTable.id, input.user_id)).limit(1);

    if (user.length === 0) {
      throw new NotFoundError("User not found");
    }

    if (user[0]!.role !== "teacher") {
      throw new BadRequestError("User must have teacher role");
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

    const result = await db.insert(TeacherProfileTable).values(newTeacher).returning();

    return result[0]!;
  }

  /**
   * Update teacher profile. `id` accepts teacher_profiles.id or users.id.
   */
  async update(id: string, input: UpdateTeacherInput): Promise<TeacherProfileEntity | null> {
    const profileId = await resolveTeacherProfileId(id);
    if (!profileId) {
      return null;
    }

    const existing = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.id, profileId))
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
    if (input.age_group_specialty !== undefined)
      updateData.age_group_specialty = input.age_group_specialty;

    const result = await db
      .update(TeacherProfileTable)
      .set(updateData)
      .where(eq(TeacherProfileTable.id, profileId))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Get students assigned to a teacher. `id` accepts teacher_profiles.id or users.id.
   */
  async students(id: string, query: { page?: number; limit?: number }) {
    const profileId = await requireTeacherProfileId(id);
    const { page, limit, offset } = getPagination(query, 20, 100);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(TeacherStudentTable)
      .where(
        and(
          eq(TeacherStudentTable.teacher_id, profileId),
          isNull(TeacherStudentTable.unassigned_at),
        ),
      );

    const total = countResult[0]?.count || 0;

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
          eq(TeacherStudentTable.teacher_id, profileId),
          isNull(TeacherStudentTable.unassigned_at),
        ),
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

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get today's sessions for a teacher (my-day)
   */
  async myDay(query: {
    date?: string;
    start_date?: string;
    end_date?: string;
    teacher_id?: string;
  }): Promise<{ sessions: SessionForDay[] }> {
    const teacherId = query.teacher_id;
    if (!teacherId) {
      return { sessions: [] };
    }

    if (query.start_date && query.end_date) {
      const sessions = await this.attendanceService.getTeacherSessionsInRange(
        teacherId,
        query.start_date,
        query.end_date,
      );
      return { sessions };
    }

    const date = query.date || new Date().toISOString().split("T")[0]!;
    const sessions = await this.attendanceService.getTeacherDaySessions(teacherId, date);

    return { sessions };
  }
}
