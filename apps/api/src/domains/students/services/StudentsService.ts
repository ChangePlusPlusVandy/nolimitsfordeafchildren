import { Service } from "typedi";
import { db } from "../../../db";
import {
  StudentTable,
  SiblingTable,
  TeacherStudentTable,
  ParentStudentLinkTable,
  LocationTable,
  TeacherProfileTable,
  UserTable,
  ParentProfileTable,
  type StudentEntity,
  type SiblingEntity,
} from "../../../db/schema";
import { eq, and, isNull, ilike, or, sql } from "drizzle-orm";

// Types
export type UserRole = "administrator" | "teacher" | "parent";

export interface StudentFilters {
  search?: string;
  site_id?: string;
  is_active?: boolean;
  limit?: number;
  cursor?: string;
}

export interface CreateStudentInput {
  site_id: string;
  first_name: string;
  last_name: string;
  initials?: string;
  dob: string;
  current_school?: string;
  preferred_language?: string;
  guardian_summary?: string;
}

export interface UpdateStudentInput {
  site_id?: string;
  first_name?: string;
  last_name?: string;
  initials?: string;
  dob?: string;
  current_school?: string;
  preferred_language?: string;
  guardian_summary?: string;
  is_active?: boolean;
}

export interface AddSiblingInput {
  name: string;
  age?: number;
  relationship: string;
  photo_url?: string;
  notes?: string;
}

export interface UpdateSiblingInput {
  name?: string;
  age?: number;
  relationship?: string;
  photo_url?: string;
  notes?: string;
}

export interface LinkTeacherInput {
  teacher_id: string;
}

export interface LinkParentInput {
  parent_id: string;
  relationship?: string;
  is_primary?: boolean;
}

@Service()
export class StudentsService {
  /**
   * List students with filtering and role-based scoping
   * - Admins see all students
   * - Teachers see only their assigned students
   * - Parents see only their linked children
   */
  async index(
    filters: StudentFilters,
    userRole: UserRole,
    userId?: string
  ): Promise<{ items: any[]; nextCursor: string | null }> {
    const limit = filters.limit ?? 50;

    // Build base query conditions
    const conditions: any[] = [];

    // Apply search filter (on initials only for privacy in list view)
    if (filters.search) {
      conditions.push(
        or(
          ilike(StudentTable.initials, `%${filters.search}%`),
          ilike(StudentTable.first_name, `%${filters.search}%`),
          ilike(StudentTable.last_name, `%${filters.search}%`)
        )
      );
    }

    // Apply site filter
    if (filters.site_id) {
      conditions.push(eq(StudentTable.site_id, filters.site_id));
    }

    // Apply active filter
    if (filters.is_active !== undefined) {
      conditions.push(eq(StudentTable.is_active, filters.is_active));
    }

    // Apply cursor for pagination
    if (filters.cursor) {
      conditions.push(sql`${StudentTable.id} > ${filters.cursor}`);
    }

    let students: StudentEntity[];

    if (userRole === "administrator") {
      // Admins see all students
      students = await db
        .select()
        .from(StudentTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(StudentTable.id)
        .limit(limit + 1);
    } else if (userRole === "teacher" && userId) {
      // Teachers see only assigned students
      const teacherProfile = await db
        .select()
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, userId))
        .limit(1);

      if (!teacherProfile.length) {
        return { items: [], nextCursor: null };
      }

      const teacherProfileId = teacherProfile[0]!.id;
      students = await db
        .select({
          id: StudentTable.id,
          site_id: StudentTable.site_id,
          first_name: StudentTable.first_name,
          last_name: StudentTable.last_name,
          initials: StudentTable.initials,
          dob: StudentTable.dob,
          current_school: StudentTable.current_school,
          preferred_language: StudentTable.preferred_language,
          guardian_summary: StudentTable.guardian_summary,
          is_active: StudentTable.is_active,
          created_at: StudentTable.created_at,
          updated_at: StudentTable.updated_at,
        })
        .from(StudentTable)
        .innerJoin(
          TeacherStudentTable,
          and(
            eq(TeacherStudentTable.student_id, StudentTable.id),
            eq(TeacherStudentTable.teacher_id, teacherProfileId),
            isNull(TeacherStudentTable.unassigned_at)
          )
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(StudentTable.id)
        .limit(limit + 1);
    } else if (userRole === "parent" && userId) {
      // Parents see only their linked children
      const parentProfile = await db
        .select()
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, userId))
        .limit(1);

      if (!parentProfile.length) {
        return { items: [], nextCursor: null };
      }

      const parentProfileId = parentProfile[0]!.id;
      students = await db
        .select({
          id: StudentTable.id,
          site_id: StudentTable.site_id,
          first_name: StudentTable.first_name,
          last_name: StudentTable.last_name,
          initials: StudentTable.initials,
          dob: StudentTable.dob,
          current_school: StudentTable.current_school,
          preferred_language: StudentTable.preferred_language,
          guardian_summary: StudentTable.guardian_summary,
          is_active: StudentTable.is_active,
          created_at: StudentTable.created_at,
          updated_at: StudentTable.updated_at,
        })
        .from(StudentTable)
        .innerJoin(
          ParentStudentLinkTable,
          and(
            eq(ParentStudentLinkTable.student_id, StudentTable.id),
            eq(ParentStudentLinkTable.parent_id, parentProfileId),
            isNull(ParentStudentLinkTable.revoked_at)
          )
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(StudentTable.id)
        .limit(limit + 1);
    } else {
      return { items: [], nextCursor: null };
    }

    // Determine if there are more results
    const hasMore = students.length > limit;
    if (hasMore) {
      students.pop();
    }

    // For list views, show only initials (not full names) for PII protection
    const items = students.map((student) => ({
      id: student.id,
      initials: student.initials,
      site_id: student.site_id,
      dob: student.dob,
      is_active: student.is_active,
      // Only admins see full names in list view
      ...(userRole === "administrator" && {
        first_name: student.first_name,
        last_name: student.last_name,
      }),
    }));

    return {
      items,
      nextCursor: hasMore && students.length > 0 ? students[students.length - 1]!.id : null,
    };
  }

  /**
   * Get student details with siblings, teachers, and parents
   */
  async show(id: string): Promise<any> {
    // Get student
    const [student] = await db
      .select()
      .from(StudentTable)
      .where(eq(StudentTable.id, id))
      .limit(1);

    if (!student) {
      return null;
    }

    // Get site info
    const [site] = await db
      .select()
      .from(LocationTable)
      .where(eq(LocationTable.id, student.site_id))
      .limit(1);

    // Get siblings
    const siblings = await db
      .select()
      .from(SiblingTable)
      .where(eq(SiblingTable.student_id, id));

    // Get linked teachers (active only)
    const teacherLinks = await db
      .select({
        link_id: TeacherStudentTable.id,
        teacher_id: TeacherStudentTable.teacher_id,
        assigned_at: TeacherStudentTable.assigned_at,
        teacher_name: UserTable.name,
        teacher_email: UserTable.email,
      })
      .from(TeacherStudentTable)
      .innerJoin(
        TeacherProfileTable,
        eq(TeacherStudentTable.teacher_id, TeacherProfileTable.id)
      )
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(TeacherStudentTable.student_id, id),
          isNull(TeacherStudentTable.unassigned_at)
        )
      );

    // Get linked parents (active only)
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
      .innerJoin(
        ParentProfileTable,
        eq(ParentStudentLinkTable.parent_id, ParentProfileTable.id)
      )
      .innerJoin(UserTable, eq(ParentProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(ParentStudentLinkTable.student_id, id),
          isNull(ParentStudentLinkTable.revoked_at)
        )
      );

    return {
      ...student,
      site: site
        ? {
            id: site.id,
            name: site.name,
            type: site.type,
          }
        : null,
      siblings: siblings.map((s) => ({
        id: s.id,
        name: s.name,
        age: s.age,
        relationship: s.relationship,
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
    };
  }

  /**
   * Create a new student (admin only)
   */
  async create(data: CreateStudentInput): Promise<StudentEntity> {
    // Auto-generate initials if not provided
    const initials =
      data.initials ||
      `${data.first_name.charAt(0)}${data.last_name.charAt(0)}`.toUpperCase();

    const [student] = await db
      .insert(StudentTable)
      .values({
        site_id: data.site_id,
        first_name: data.first_name,
        last_name: data.last_name,
        initials,
        dob: data.dob,
        current_school: data.current_school,
        preferred_language: data.preferred_language || "English",
        guardian_summary: data.guardian_summary,
      })
      .returning();

    if (!student) {
      throw new Error("Failed to create student");
    }

    return student;
  }

  /**
   * Update a student (admin only)
   */
  async update(id: string, data: UpdateStudentInput): Promise<StudentEntity | null> {
    const [student] = await db
      .update(StudentTable)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(StudentTable.id, id))
      .returning();

    return student || null;
  }

  /**
   * Add a sibling to a student
   */
  async addSibling(studentId: string, data: AddSiblingInput): Promise<SiblingEntity> {
    const [sibling] = await db
      .insert(SiblingTable)
      .values({
        student_id: studentId,
        name: data.name,
        age: data.age,
        relationship: data.relationship,
        photo_url: data.photo_url,
        notes: data.notes,
      })
      .returning();

    if (!sibling) {
      throw new Error("Failed to create sibling");
    }

    return sibling;
  }

  /**
   * Update a sibling
   */
  async updateSibling(siblingId: string, data: UpdateSiblingInput): Promise<SiblingEntity | null> {
    const [sibling] = await db
      .update(SiblingTable)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(SiblingTable.id, siblingId))
      .returning();

    return sibling || null;
  }

  /**
   * Remove a sibling
   */
  async removeSibling(siblingId: string): Promise<{ ok: boolean }> {
    await db.delete(SiblingTable).where(eq(SiblingTable.id, siblingId));
    return { ok: true };
  }

  /**
   * Get student's teachers (existing method - updated)
   */
  async teachers(studentId: string, _query: any): Promise<{ items: any[]; nextCursor: null }> {
    const teacherLinks = await db
      .select({
        link_id: TeacherStudentTable.id,
        teacher_id: TeacherStudentTable.teacher_id,
        assigned_at: TeacherStudentTable.assigned_at,
        teacher_name: UserTable.name,
        teacher_email: UserTable.email,
      })
      .from(TeacherStudentTable)
      .innerJoin(
        TeacherProfileTable,
        eq(TeacherStudentTable.teacher_id, TeacherProfileTable.id)
      )
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(TeacherStudentTable.student_id, studentId),
          isNull(TeacherStudentTable.unassigned_at)
        )
      );

    return {
      items: teacherLinks.map((t) => ({
        link_id: t.link_id,
        teacher_id: t.teacher_id,
        name: t.teacher_name,
        email: t.teacher_email,
        assigned_at: t.assigned_at,
      })),
      nextCursor: null,
    };
  }

  /**
   * Link a teacher to a student (admin only)
   */
  async linkTeacher(studentId: string, teacherId: string): Promise<{ ok: boolean; link_id: string }> {
    // Check if already linked
    const existing = await db
      .select()
      .from(TeacherStudentTable)
      .where(
        and(
          eq(TeacherStudentTable.student_id, studentId),
          eq(TeacherStudentTable.teacher_id, teacherId),
          isNull(TeacherStudentTable.unassigned_at)
        )
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      return { ok: true, link_id: existing[0].id };
    }

    const [link] = await db
      .insert(TeacherStudentTable)
      .values({
        student_id: studentId,
        teacher_id: teacherId,
      })
      .returning();

    if (!link) {
      throw new Error("Failed to link teacher");
    }

    return { ok: true, link_id: link.id };
  }

  /**
   * Unlink a teacher from a student (admin only)
   * Soft delete by setting unassigned_at
   */
  async unlinkTeacher(studentId: string, teacherId: string): Promise<{ ok: boolean }> {
    await db
      .update(TeacherStudentTable)
      .set({ unassigned_at: new Date() })
      .where(
        and(
          eq(TeacherStudentTable.student_id, studentId),
          eq(TeacherStudentTable.teacher_id, teacherId),
          isNull(TeacherStudentTable.unassigned_at)
        )
      );

    return { ok: true };
  }

  /**
   * Get student's parents (existing method - updated)
   */
  async parents(studentId: string): Promise<{ items: any[] }> {
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
      .innerJoin(
        ParentProfileTable,
        eq(ParentStudentLinkTable.parent_id, ParentProfileTable.id)
      )
      .innerJoin(UserTable, eq(ParentProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(ParentStudentLinkTable.student_id, studentId),
          isNull(ParentStudentLinkTable.revoked_at)
        )
      );

    return {
      items: parentLinks.map((p) => ({
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
    };
  }

  /**
   * Link a parent to a student (admin only)
   * @param studentId - The student's ID
   * @param parentUserId - The parent's USER ID (not parent_profile.id)
   * @param relationship - Relationship type (mother, father, guardian, etc.)
   * @param isPrimary - Whether this is the primary parent
   */
  async linkParent(
    studentId: string,
    parentUserId: string,
    relationship?: string,
    isPrimary?: boolean
  ): Promise<{ ok: boolean; link_id: string }> {
    // Look up the parent profile for this user
    let parentProfileId: string;
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (!parentProfile || parentProfile.length === 0) {
      // Defensive: Create parent profile if missing (e.g., role was changed but profile wasn't created)
      const [newProfile] = await db
        .insert(ParentProfileTable)
        .values({ user_id: parentUserId })
        .returning({ id: ParentProfileTable.id });

      if (!newProfile) {
        throw new Error("Failed to create parent profile");
      }
      parentProfileId = newProfile.id;
    } else {
      parentProfileId = parentProfile[0]!.id;
    }

    // Check if already linked
    const existing = await db
      .select()
      .from(ParentStudentLinkTable)
      .where(
        and(
          eq(ParentStudentLinkTable.student_id, studentId),
          eq(ParentStudentLinkTable.parent_id, parentProfileId),
          isNull(ParentStudentLinkTable.revoked_at)
        )
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      return { ok: true, link_id: existing[0].id };
    }

    const [link] = await db
      .insert(ParentStudentLinkTable)
      .values({
        student_id: studentId,
        parent_id: parentProfileId,
        relationship,
        is_primary: isPrimary ?? false,
      })
      .returning();

    if (!link) {
      throw new Error("Failed to link parent");
    }

    return { ok: true, link_id: link.id };
  }

  /**
   * Unlink a parent from a student (admin only)
   * Soft delete by setting revoked_at
   * @param studentId - The student's ID
   * @param parentUserId - The parent's USER ID (not parent_profile.id)
   */
  async unlinkParent(studentId: string, parentUserId: string): Promise<{ ok: boolean }> {
    // Look up the parent profile for this user
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, parentUserId))
      .limit(1);

    if (!parentProfile || parentProfile.length === 0) {
      // No parent profile exists, nothing to unlink
      return { ok: true };
    }

    const parentProfileId = parentProfile[0]!.id;

    await db
      .update(ParentStudentLinkTable)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(ParentStudentLinkTable.student_id, studentId),
          eq(ParentStudentLinkTable.parent_id, parentProfileId),
          isNull(ParentStudentLinkTable.revoked_at)
        )
      );

    return { ok: true };
  }

  // Legacy methods for backward compatibility
  async assignTeacher(studentId: string, body: { teacher_id: string }): Promise<{ ok: boolean; link_id: string }> {
    return this.linkTeacher(studentId, body.teacher_id);
  }

  async unassignTeacher(studentId: string, teacherId: string): Promise<{ ok: boolean }> {
    return this.unlinkTeacher(studentId, teacherId);
  }

  async addParent(studentId: string, body: LinkParentInput): Promise<{ ok: boolean; link_id: string }> {
    return this.linkParent(studentId, body.parent_id, body.relationship, body.is_primary);
  }

  async removeParent(studentId: string, parentId: string): Promise<{ ok: boolean }> {
    return this.unlinkParent(studentId, parentId);
  }
}
