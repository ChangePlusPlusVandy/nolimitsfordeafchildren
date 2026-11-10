import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { LocationTable, TeacherProfileTable, UserTable } from "@/_platform/db/schema";
import { buildPaginatedResponse, getPagination } from "@/_shared/server/pagination";

import type { ListTeachersQuery, TeacherWithUser } from "../_domain/types";

export async function listTeachers(query: ListTeachersQuery): Promise<{
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

  const sortColumn = query.sort === "created_at" ? TeacherProfileTable.created_at : UserTable.name;
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
    primarySite: row.site_id ? { id: row.site_id, name: row.site_name! } : null,
  }));

  return buildPaginatedResponse(items, total, page, limit);
}
