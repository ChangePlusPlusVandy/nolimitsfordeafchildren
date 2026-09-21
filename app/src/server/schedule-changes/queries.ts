"use server";
import { type RequestStatus, ScheduleChangeService } from "@/server/schedule-changes/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError } from "@/server/shared/errors";

/**
 * GET /v1/schedule-change-requests — administrator sees all; teachers see
 * requests touching their schedules.
 */
export async function listScheduleChangeRequests(
  query: {
    status?: RequestStatus;
    student_id?: string;
    site_id?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const currentUser = await requireRole("administrator", "teacher");

  if (currentUser.role === "teacher") {
    return await new ScheduleChangeService().listRequestsForTeacher(currentUser.id, query);
  }

  return await new ScheduleChangeService().listRequests(query);
}

/**
 * GET /v1/schedule-change-requests/:id — administrator | parent | teacher
 * (parents/teachers only for requests they can see; others get 404).
 */
export async function getScheduleChangeRequest(id: string) {
  const currentUser = await requireRole("administrator", "parent", "teacher");
  const service = new ScheduleChangeService();

  if (currentUser.role === "parent") {
    const canView = await service.isRequestVisibleToParent(id, currentUser.id);
    if (!canView) {
      throw new HttpError(404, "NOT_FOUND", "Schedule change request not found");
    }
  }

  if (currentUser.role === "teacher") {
    const canView = await service.isRequestVisibleToTeacher(id, currentUser.id);
    if (!canView) {
      throw new HttpError(404, "NOT_FOUND", "Schedule change request not found");
    }
  }

  const request = await service.showRequest(id);
  if (!request) {
    throw new HttpError(404, "NOT_FOUND", "Schedule change request not found");
  }
  return request;
}

/**
 * GET /v1/parents/me/schedule-change-requests — current parent's children.
 */
export async function listParentScheduleChangeRequests(
  query: { page?: number; limit?: number } = {},
) {
  const currentUser = await requireRole("parent");
  return await new ScheduleChangeService().listRequestsForParent(currentUser.id, query);
}

/**
 * Schedule-change requests for the current teacher (admin sees all) —
 * client-facing name (src/client/schedule-changes.ts imports it).
 */
export async function listScheduleChangeRequestsForTeacher(
  query: { status?: RequestStatus; page?: number; limit?: number } = {},
) {
  const currentUser = await requireRole("administrator", "teacher");

  if (currentUser.role === "teacher") {
    return await new ScheduleChangeService().listRequestsForTeacher(currentUser.id, query);
  }

  return await new ScheduleChangeService().listRequests(query);
}
