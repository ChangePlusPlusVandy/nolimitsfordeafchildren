import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  PhotoTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  type UserEntity,
} from "@/_platform/db/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/_shared/server/errors";

import type { ListPhotosQuery } from "../_domain/types";

class PhotoAccess {
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
      throw new NotFoundError("Location not found");
    }

    if (studentId) {
      const student = await db
        .select({ id: StudentTable.id, site_id: StudentTable.site_id })
        .from(StudentTable)
        .where(eq(StudentTable.id, studentId))
        .limit(1);

      if (!student[0]) {
        throw new NotFoundError("Student not found");
      }

      if (student[0].site_id !== locationId) {
        throw new BadRequestError("Student is not assigned to this location");
      }
    }
  }

  async assertCanUpload(
    input: { location_id: string; student_id?: string },
    currentUser: UserEntity,
  ) {
    await this.validateLocationAndStudent(input.location_id, input.student_id);

    if (currentUser.role === "teacher") {
      const allowedLocationIds = await this.getTeacherAllowedLocationIds(currentUser.id);
      if (!allowedLocationIds.includes(input.location_id)) {
        throw new ForbiddenError("Teacher is not assigned to this location");
      }
    }
  }

  async galleryConditions(query: ListPhotosQuery, currentUser: UserEntity) {
    const conditions = [];

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
        return null;
      }
      conditions.push(inArray(PhotoTable.location_id, allowedLocationIds));
    }

    if (currentUser.role === "parent") {
      const studentIds = await this.getParentAllowedStudentIds(currentUser.id);
      const locationIds = await this.getParentAllowedLocationIds(currentUser.id);

      if (studentIds.length === 0 || locationIds.length === 0) {
        return null;
      }

      conditions.push(inArray(PhotoTable.location_id, locationIds));

      if (query.student_id) {
        if (!studentIds.includes(query.student_id)) {
          return null;
        }
      } else {
        conditions.push(
          or(isNull(PhotoTable.student_id), inArray(PhotoTable.student_id, studentIds))!,
        );
      }
    }

    return conditions;
  }
}

export const photoAccess = new PhotoAccess();
