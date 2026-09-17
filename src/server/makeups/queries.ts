"use server";
import { MakeupService, type RequestStatus } from "@/server/makeups/service";
import { ParentsService } from "@/server/parents/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError } from "@/server/shared/errors";

/**
 * GET /v1/makeup-requests — list (admin only).
 */
export async function listMakeupRequests(
  query: {
    status?: RequestStatus;
    student_id?: string;
    site_id?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  await requireRole("administrator");
  return await new MakeupService().listRequests(query);
}

/**
 * GET /v1/makeup-requests/:id — administrator | parent (parents only for
 * their own children; hidden requests return 404).
 */
export async function getMakeupRequest(id: string) {
  const currentUser = await requireRole("administrator", "parent");

  if (currentUser.role === "parent") {
    const canView = await new MakeupService().isRequestVisibleToParent(id, currentUser.id);
    if (!canView) {
      throw new HttpError(404, "NOT_FOUND", "Makeup request not found");
    }
  }

  const request = await new MakeupService().showRequest(id);
  if (!request) {
    throw new HttpError(404, "NOT_FOUND", "Makeup request not found");
  }
  return request;
}

/**
 * GET /v1/teachers/:teacherId/makeup-sessions — administrator | teacher
 * (teachers can only view their own sessions).
 */
export async function listTeacherMakeupSessions(
  teacherId: string,
  query: { date?: string; page?: number; limit?: number } = {},
) {
  const currentUser = await requireRole("administrator", "teacher");

  if (currentUser.role === "teacher") {
    const canView = await new MakeupService().isTeacherAuthorizedForSession(
      currentUser.id,
      teacherId,
    );
    if (!canView) {
      throw new HttpError(403, "FORBIDDEN", "You can only view your own makeup sessions");
    }
  }

  return await new MakeupService().listSessionsForTeacher(teacherId, query);
}

/**
 * GET /v1/parents/me/makeup-requests — current parent's children (parent).
 */
export async function listParentMakeupRequests(query: { page?: number; limit?: number } = {}) {
  const currentUser = await requireRole("parent");
  return await new MakeupService().listRequestsForParent(currentUser.id, query);
}

/**
 * Client-facing aliases (src/client/makeups.ts imports these names).
 */
export async function listMakeupSessionsForTeacher(
  teacherId: string,
  query: { date?: string; page?: number; limit?: number } = {},
) {
  return await listTeacherMakeupSessions(teacherId, query);
}

export async function listMakeupRequestsForParent(query: { page?: number; limit?: number } = {}) {
  return await listParentMakeupRequests(query);
}

/**
 * Missed sessions (no-shows in the last 30 days without an existing makeup
 * request) eligible for a makeup request — parent | administrator. The
 * logic lives in ParentsService.getMissedSessions (used by childDetail);
 * this exposes it for the makeup-request composer.
 */
export async function getMakeupableMissedSessions(studentId: string) {
  await requireRole("parent", "administrator");
  return await new ParentsService().getMissedSessionsForStudent(studentId);
}
