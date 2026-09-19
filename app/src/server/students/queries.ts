"use server";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";
import { assertCanAccessStudent } from "@/server/shared/student-access";
import { type StudentFilters, StudentsService } from "@/server/students/service";

/**
 * GET /v1/students — role-scoped student list (any authenticated user;
 * teachers see assigned, parents see linked children).
 */
export async function listStudents(query: StudentFilters = {}) {
  const user = await requireRole();
  return await new StudentsService().index(query, user.role, user.id);
}

/**
 * GET /v1/students/:id — role-scoped student detail.
 */
export async function getStudent(id: string) {
  const user = await requireRole();
  const student = await new StudentsService().show(id, { id: user.id, role: user.role });
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}

/**
 * GET /v1/students/:id/teachers — any authenticated user.
 */
export async function getStudentTeachers(
  id: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole();
  await assertCanAccessStudent(user, id);
  return await new StudentsService().teachers(id, query);
}

export async function getStudentParents(id: string, query: { page?: number; limit?: number } = {}) {
  const user = await requireRole();
  await assertCanAccessStudent(user, id);
  return await new StudentsService().parents(id, query);
}

/**
 * GET /v1/students/linkable-teachers — admin autocomplete for linking teachers.
 */
export async function listLinkableTeachers(
  query: { search?: string; page?: number; limit?: number } = {},
) {
  await requireRole("administrator");
  return await new StudentsService().listLinkableTeachers(query);
}
