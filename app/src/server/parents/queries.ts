"use server";
import { staffByLocation } from "@/server/locations/queries";
import { ParentsService } from "@/server/parents/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

/**
 * GET /v1/parents/me/children — current parent's linked children (parent).
 */
export async function myChildren(query: { page?: number; limit?: number } = {}) {
  const user = await requireRole("parent");
  return await new ParentsService().myChildren(user.id, query);
}

/**
 * GET /v1/parents/children/:studentId — child detail (parent).
 */
export async function childDetail(studentId: string) {
  const user = await requireRole("parent");
  const result = await new ParentsService().childDetail(user.id, studentId);
  if (!result) {
    throw new NotFoundError("Student not found or access denied");
  }
  return result;
}

/**
 * GET /v1/parents/directory — admin/teacher directory visible to parent.
 */
export async function directory(query: { page?: number; limit?: number } = {}) {
  const user = await requireRole("parent");
  return await new ParentsService().directory(user.id, query);
}

/**
 * GET /v1/parents/zip-report — grant-reporting zip report (admin).
 */
export async function zipReport(query: { page?: number; limit?: number } = {}) {
  await requireRole("administrator");
  return await new ParentsService().zipReport(query);
}

/**
 * Client-facing aliases (src/client/parents.ts imports these names).
 */
export async function getMyChildren(query: { page?: number; limit?: number } = {}) {
  return await myChildren(query);
}

export async function getChildDetails(studentId: string) {
  return await childDetail(studentId);
}

export async function getDirectory(query: { page?: number; limit?: number } = {}) {
  return await directory(query);
}

export async function getZipReport(query: { page?: number; limit?: number } = {}) {
  return await zipReport(query);
}

export async function getLocationStaff(siteId: string) {
  return staffByLocation(siteId);
}
