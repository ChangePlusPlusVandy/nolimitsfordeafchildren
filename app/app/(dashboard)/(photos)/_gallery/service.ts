import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  LocationTable,
  PhotoTable,
  StudentTable,
  type UserEntity,
  UserTable,
} from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import { photoAccess } from "../_access/service";
import type { ListPhotosQuery } from "../_domain/types";

export async function listPhotos(
  query: ListPhotosQuery,
  currentUser: UserEntity,
  // eslint-disable-next-line typescript/no-explicit-any -- joined photo payload shape varies per row (ported legacy signature)
): Promise<PaginatedResponse<any>> {
  const { page, limit, offset } = getPagination(query, 40, 100);
  const conditions = await photoAccess.galleryConditions(query, currentUser);
  if (conditions === null) {
    return buildPaginatedResponse([], 0, page, limit);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(PhotoTable)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  const rows = await db
    .select({
      id: PhotoTable.id,
      location_id: PhotoTable.location_id,
      student_id: PhotoTable.student_id,
      session_date: PhotoTable.session_date,
      caption: PhotoTable.caption,
      file_url: PhotoTable.file_url,
      file_name: PhotoTable.file_name,
      file_size: PhotoTable.file_size,
      mime_type: PhotoTable.mime_type,
      uploaded_by: PhotoTable.uploaded_by,
      created_at: PhotoTable.created_at,
      updated_at: PhotoTable.updated_at,
      location_name: LocationTable.name,
      student_initials: StudentTable.initials,
      uploader_name: UserTable.name,
    })
    .from(PhotoTable)
    .innerJoin(LocationTable, eq(PhotoTable.location_id, LocationTable.id))
    .leftJoin(StudentTable, eq(PhotoTable.student_id, StudentTable.id))
    .innerJoin(UserTable, eq(PhotoTable.uploaded_by, UserTable.id))
    .where(whereClause)
    .orderBy(desc(PhotoTable.session_date), desc(PhotoTable.created_at), asc(PhotoTable.id))
    .limit(limit)
    .offset(offset);

  const items = rows.map((row) => ({
    id: row.id,
    location_id: row.location_id,
    student_id: row.student_id,
    session_date: row.session_date,
    caption: row.caption,
    file_url: row.file_url,
    file_name: row.file_name,
    file_size: row.file_size,
    mime_type: row.mime_type,
    uploaded_by: row.uploaded_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    location: {
      id: row.location_id,
      name: row.location_name,
    },
    student: row.student_id
      ? {
          id: row.student_id,
          initials: row.student_initials || "",
        }
      : null,
    uploaded_by_user: {
      id: row.uploaded_by,
      name: row.uploader_name,
    },
  }));

  return buildPaginatedResponse(items, total, page, limit);
}
