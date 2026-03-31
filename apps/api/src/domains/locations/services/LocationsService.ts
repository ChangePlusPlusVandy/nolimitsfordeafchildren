import { Service } from "typedi";
import { db } from "@/db";
import { LocationTable, ScheduleTable } from "@/db/schema";
import type { LocationEntity, LocationInsert } from "@/db/schema";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";
import { eq, and, gte, lte, ilike, or, asc, desc, sql } from "drizzle-orm";

export type CreateLocationDto = Omit<LocationInsert, "id" | "created_at" | "updated_at">;
export type UpdateLocationDto = Partial<CreateLocationDto>;

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

@Service()
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
          ilike(LocationTable.name, searchQuery),
          ilike(LocationTable.city, searchQuery),
          ilike(LocationTable.state, searchQuery),
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
      .select({ count: sql<number>`count(*)::int` })
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

    return results;
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
}
