import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import {
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  type PhotoEntity,
  type PhotoInsert,
  PhotoTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  type UserEntity,
  UserTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { deleteFile, extractKeyFromUrl, getPublicUrl, getUploadUrl } from "@/lib/r2";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";

export interface GetPhotoUploadUrlInput {
  location_id: string;
  session_date: string;
  student_id?: string;
  file_name: string;
  content_type: string;
}

export interface CreatePhotoInput {
  location_id: string;
  session_date: string;
  student_id?: string;
  caption?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export interface ListPhotosQuery {
  location_id?: string;
  student_id?: string;
  session_date?: string;
  page?: number;
  limit?: number;
}

export class PhotosService {
  private async getTeacherAllowedLocationIds(userId: string): Promise<string[]> {
    const teacherProfile = await db
      .select({ id: TeacherProfileTable.id, primary_site_id: TeacherProfileTable.primary_site_id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, userId))
      .limit(1);

    if (!teacherProfile[0]) {
      return [];
    }

    const explicitLocations = await db
      .select({ location_id: TeacherLocationTable.location_id })
      .from(TeacherLocationTable)
      .where(eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0].id));

    const ids = new Set(explicitLocations.map((row) => row.location_id));
    if (teacherProfile[0].primary_site_id) {
      ids.add(teacherProfile[0].primary_site_id);
    }

    return Array.from(ids);
  }

  private async getParentAllowedStudentIds(userId: string): Promise<string[]> {
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, userId))
      .limit(1);

    if (!parentProfile[0]) {
      return [];
    }

    const links = await db
      .select({ student_id: ParentStudentLinkTable.student_id })
      .from(ParentStudentLinkTable)
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0].id),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      );

    return links.map((link) => link.student_id);
  }

  private async getParentAllowedLocationIds(userId: string): Promise<string[]> {
    const studentIds = await this.getParentAllowedStudentIds(userId);
    if (studentIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({ site_id: StudentTable.site_id })
      .from(StudentTable)
      .where(inArray(StudentTable.id, studentIds));

    return Array.from(new Set(rows.map((row) => row.site_id)));
  }

  private async validateLocationAndStudent(locationId: string, studentId?: string) {
    const location = await db
      .select({ id: LocationTable.id })
      .from(LocationTable)
      .where(eq(LocationTable.id, locationId))
      .limit(1);

    if (!location[0]) {
      throw new Error("Location not found");
    }

    if (studentId) {
      const student = await db
        .select({ id: StudentTable.id, site_id: StudentTable.site_id })
        .from(StudentTable)
        .where(eq(StudentTable.id, studentId))
        .limit(1);

      if (!student[0]) {
        throw new Error("Student not found");
      }

      if (student[0].site_id !== locationId) {
        throw new Error("Student is not assigned to this location");
      }
    }
  }

  async getUploadUrl(input: GetPhotoUploadUrlInput, currentUser: UserEntity) {
    await this.validateLocationAndStudent(input.location_id, input.student_id);

    if (currentUser.role === "teacher") {
      const allowedLocationIds = await this.getTeacherAllowedLocationIds(currentUser.id);
      if (!allowedLocationIds.includes(input.location_id)) {
        throw new Error("Teacher is not assigned to this location");
      }
    }

    const extension = input.file_name.split(".").pop() || "jpg";
    const fileKey = `photos/location/${input.location_id}/${input.session_date}/${randomUUID()}.${extension}`;
    const uploadUrl = getUploadUrl(fileKey, input.content_type);

    return {
      upload_url: uploadUrl,
      file_key: fileKey,
      file_url: getPublicUrl(fileKey),
    };
  }

  async createPhoto(input: CreatePhotoInput, currentUser: UserEntity): Promise<PhotoEntity> {
    await this.validateLocationAndStudent(input.location_id, input.student_id);

    if (currentUser.role === "teacher") {
      const allowedLocationIds = await this.getTeacherAllowedLocationIds(currentUser.id);
      if (!allowedLocationIds.includes(input.location_id)) {
        throw new Error("Teacher is not assigned to this location");
      }
    }

    const payload: PhotoInsert = {
      location_id: input.location_id,
      student_id: input.student_id || null,
      session_date: input.session_date,
      caption: input.caption || null,
      file_url: input.file_url,
      file_name: input.file_name,
      file_size: input.file_size || null,
      mime_type: input.mime_type || null,
      uploaded_by: currentUser.id,
    };

    const result = await db.insert(PhotoTable).values(payload).returning();
    return result[0]!;
  }

  async listPhotos(
    query: ListPhotosQuery,
    currentUser: UserEntity,
    // biome-ignore lint/suspicious/noExplicitAny: joined photo payload shape varies per row (ported legacy signature)
  ): Promise<PaginatedResponse<any>> {
    const conditions = [];
    const { page, limit, offset } = getPagination(query, 40, 100);

    if (query.location_id) {
      conditions.push(eq(PhotoTable.location_id, query.location_id));
    }

    if (query.student_id) {
      conditions.push(eq(PhotoTable.student_id, query.student_id));
    }

    if (query.session_date) {
      conditions.push(eq(PhotoTable.session_date, query.session_date));
    }

    if (currentUser.role === "teacher") {
      const allowedLocationIds = await this.getTeacherAllowedLocationIds(currentUser.id);
      if (allowedLocationIds.length === 0) {
        return buildPaginatedResponse([], 0, page, limit);
      }
      conditions.push(inArray(PhotoTable.location_id, allowedLocationIds));
    }

    if (currentUser.role === "parent") {
      const studentIds = await this.getParentAllowedStudentIds(currentUser.id);
      const locationIds = await this.getParentAllowedLocationIds(currentUser.id);

      if (studentIds.length === 0 || locationIds.length === 0) {
        return buildPaginatedResponse([], 0, page, limit);
      }

      conditions.push(inArray(PhotoTable.location_id, locationIds));

      if (query.student_id) {
        if (!studentIds.includes(query.student_id)) {
          return buildPaginatedResponse([], 0, page, limit);
        }
      } else {
        conditions.push(
          or(isNull(PhotoTable.student_id), inArray(PhotoTable.student_id, studentIds))!,
        );
      }
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

  async deletePhoto(photoId: string): Promise<boolean> {
    const photo = await db.select().from(PhotoTable).where(eq(PhotoTable.id, photoId)).limit(1);
    if (!photo[0]) {
      return false;
    }

    const fileKey = extractKeyFromUrl(photo[0].file_url);
    if (fileKey) {
      await deleteFile(fileKey);
    }

    await db.delete(PhotoTable).where(eq(PhotoTable.id, photoId));
    return true;
  }
}
