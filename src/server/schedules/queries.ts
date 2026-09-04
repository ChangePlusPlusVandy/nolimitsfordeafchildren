import {
  type AvailableSchedulesQuery,
  type ListSchedulesQuery,
  SchedulesService,
} from "@/server/schedules/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

/**
 * GET /v1/schedules — any authenticated user.
 */
export async function listSchedules(query: ListSchedulesQuery = {}) {
  await requireRole();
  return await new SchedulesService().index(query);
}

/**
 * GET /v1/schedules/available — parent | administrator (browse for schedule
 * change requests).
 */
export async function availableSchedules(query: AvailableSchedulesQuery = {}) {
  await requireRole("parent", "administrator");
  return await new SchedulesService().getAvailable(query);
}

/**
 * Client-facing alias (src/client/schedule-changes.ts imports this name).
 */
export async function getAvailableSchedules(query: AvailableSchedulesQuery = {}) {
  return await availableSchedules(query);
}

/**
 * GET /v1/schedules/:id — any authenticated user.
 */
export async function getSchedule(id: string) {
  await requireRole();
  const schedule = await new SchedulesService().show(id);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }
  return schedule;
}
