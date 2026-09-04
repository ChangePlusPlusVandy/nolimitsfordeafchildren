import { and, asc, desc, eq, gte, isNull, like, lte, or, sql } from "drizzle-orm";
import type { LocationEntity, LocationInsert, UserEntity } from "@/db/schema";
import {
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  ScheduleTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/server/shared/errors";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";

export type CreateLocationDto = Omit<LocationInsert, "id" | "created_at" | "updated_at">;
export type UpdateLocationDto = Partial<CreateLocationDto>;

export interface LocationStaffMember {
  id: string;
  name: string;
  role: "administrator" | "teacher";
  email: string;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
}

export interface LocationStaffResponse {
  location_id: string;
  location_name: string;
  staff: LocationStaffMember[];
}

export type LocationMapPin = {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  type: "education_center" | "pop_up" | "remote";
  is_active: boolean;
};

export interface ListLocationsQuery {
  search?: string;
  type?: "education_center" | "pop_up" | "remote";
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "created_at";
  order?: "asc" | "desc";
}

export class LocationsService {
  /**
   * List all locations with optional filtering
   */
  async index(query: ListLocationsQuery = {}): Promise<PaginatedResponse<LocationEntity>> {
    const { page, limit, offset } = getPagination(query, 20, 100);
    const conditions = [];

    if (query.search) {
      const searchQuery = `%${query.search.trim()}%`;
      conditions.push(
        or(
          like(LocationTable.name, searchQuery),
          like(LocationTable.city, searchQuery),
          like(LocationTable.state, searchQuery),
        ),
      );
    }

    if (query.type) {
      conditions.push(eq(LocationTable.type, query.type));
    }

    if (query.is_active !== undefined) {
      conditions.push(eq(LocationTable.is_active, query.is_active));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(LocationTable)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    const sortColumn = query.sort === "created_at" ? LocationTable.created_at : LocationTable.name;
    const orderFn = query.order === "desc" ? desc : asc;

    const items = await db
      .select()
      .from(LocationTable)
      .where(whereClause)
      .orderBy(orderFn(sortColumn), asc(LocationTable.id))
      .limit(limit)
      .offset(offset);

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get a single location by ID
   */
  async show(siteId: string): Promise<LocationEntity | null> {
    const results = await db
      .select()
      .from(LocationTable)
      .where(eq(LocationTable.id, siteId))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Create a new location
   */
  async create(data: CreateLocationDto): Promise<LocationEntity> {
    const results = await db
      .insert(LocationTable)
      .values({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    return results[0]!;
  }

  /**
   * Update an existing location
   */
  async update(siteId: string, data: UpdateLocationDto): Promise<LocationEntity | null> {
    const results = await db
      .update(LocationTable)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(LocationTable.id, siteId))
      .returning();

    return results[0] || null;
  }

  /**
   * Get minimal data for map pins (optimized for map rendering)
   */
  async mapSummary(): Promise<LocationMapPin[]> {
    const results = await db
      .select({
        id: LocationTable.id,
        name: LocationTable.name,
        latitude: LocationTable.latitude,
        longitude: LocationTable.longitude,
        type: LocationTable.type,
        is_active: LocationTable.is_active,
      })
      .from(LocationTable)
      .orderBy(LocationTable.name);

    // `real` columns read back as numbers; the map-pin contract uses strings
    // (matching the old pg `numeric` driver behavior)
    return results.map((r) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude?.toString() ?? null,
      longitude: r.longitude?.toString() ?? null,
      type: r.type,
      is_active: r.is_active,
    }));
  }

  /**
   * Get current and next sessions at a location
   */
  async nowNext(siteId: string, query?: { date?: string }) {
    const today = query?.date ?? new Date().toISOString().split("T")[0]!;

    // Get schedules for this site that include today in their cycle
    const schedules = await db
      .select()
      .from(ScheduleTable)
      .where(
        and(
          eq(ScheduleTable.site_id, siteId),
          eq(ScheduleTable.is_active, true),
          lte(ScheduleTable.cycle_start_date, today),
          gte(ScheduleTable.cycle_end_date, today),
        ),
      )
      .orderBy(ScheduleTable.start_time);

    // For now, return the schedules grouped by time
    // In a full implementation, we'd check the day_of_week_mask
    // and calculate which sessions are "now" vs "next"
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;

    const nowSchedules = schedules.filter(
      (s) => s.start_time <= currentTime && s.end_time > currentTime,
    );
    const nextSchedules = schedules.filter((s) => s.start_time > currentTime);

    return {
      now: nowSchedules,
      next: nextSchedules.slice(0, 5), // Next 5 sessions
    };
  }

  /**
   * Get staff (administrators + teachers) for a specific location.
   * Parents can only view staff at locations where their children are enrolled.
   */
  async staffByLocation(siteId: string, currentUser: UserEntity): Promise<LocationStaffResponse> {
    // 1. Verify location exists
    const location = await this.show(siteId);
    if (!location) {
      throw new NotFoundError("Location not found");
    }

    // 2. If parent, verify they have at least one child at this location
    if (currentUser.role === "parent") {
      const parentProfile = await db
        .select({ id: ParentProfileTable.id })
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, currentUser.id))
        .limit(1);

      if (parentProfile.length === 0) {
        throw new ForbiddenError("Parent profile not found");
      }

      const linkedChildren = await db
        .select({ id: StudentTable.id })
        .from(ParentStudentLinkTable)
        .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
        .where(
          and(
            eq(ParentStudentLinkTable.parent_id, parentProfile[0]!.id),
            isNull(ParentStudentLinkTable.revoked_at),
            eq(StudentTable.site_id, siteId),
          ),
        )
        .limit(1);

      if (linkedChildren.length === 0) {
        throw new ForbiddenError("You do not have children enrolled at this location");
      }
    }

    // 3. Get all active administrators (they are visible at every location)
    const admins = await db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        phone: UserTable.phone,
        photo_url: UserTable.photo_url,
      })
      .from(UserTable)
      .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)))
      .orderBy(asc(UserTable.name));

    // 4. Get teachers assigned to this location
    const teachers = await db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        phone: UserTable.phone,
        photo_url: UserTable.photo_url,
        bio: TeacherProfileTable.bio,
      })
      .from(TeacherLocationTable)
      .innerJoin(
        TeacherProfileTable,
        eq(TeacherLocationTable.teacher_profile_id, TeacherProfileTable.id),
      )
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(and(eq(TeacherLocationTable.location_id, siteId), eq(UserTable.is_active, true)))
      .orderBy(asc(UserTable.name));

    // 5. Combine results
    const staff: LocationStaffMember[] = [
      ...admins.map((a) => ({
        id: a.id,
        name: a.name,
        role: "administrator" as const,
        email: a.email,
        phone: a.phone,
        photo_url: a.photo_url,
        bio: null,
      })),
      ...teachers.map((t) => ({
        id: t.id,
        name: t.name,
        role: "teacher" as const,
        email: t.email,
        phone: t.phone,
        photo_url: t.photo_url,
        bio: t.bio,
      })),
    ];

    return {
      location_id: location.id,
      location_name: location.name,
      staff,
    };
  }
}
