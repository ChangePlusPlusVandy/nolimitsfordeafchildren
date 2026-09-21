/**
 * Thin client data-access layer for Schedules.
 *
 * Names reconcile 1:1 with `src/server/schedules/{queries,actions}.ts`.
 */

import {
  checkScheduleConflicts as serverCheckScheduleConflicts,
  createSchedule as serverCreateSchedule,
  updateScheduleById as serverUpdateScheduleById,
} from "@/server/schedules/actions";
import {
  availableSchedules as serverAvailableSchedules,
  getSchedule as serverGetSchedule,
  listSchedules as serverListSchedules,
} from "@/server/schedules/queries";

export type {
  AvailableSchedulesQuery,
  ConflictCheckInput,
  ConflictResult,
  CreateScheduleInput,
  ListSchedulesQuery,
  ScheduleDetails,
  ScheduleWithDetails,
  UpdateScheduleInput,
} from "@/server/schedules/service";

export async function listSchedules(
  params?: import("@/server/schedules/service").ListSchedulesQuery,
) {
  return serverListSchedules(params);
}

export async function getScheduleDetails(id: string) {
  return serverGetSchedule(id);
}

export async function getAvailableSchedules(
  params?: import("@/server/schedules/service").AvailableSchedulesQuery,
) {
  return serverAvailableSchedules(params);
}

export async function checkScheduleConflicts(
  input: import("@/server/schedules/service").ConflictCheckInput,
) {
  return serverCheckScheduleConflicts(input);
}

export async function createSchedule({
  teacherId,
  ...data
}: import("@/server/schedules/service").CreateScheduleInput & { teacherId: string }) {
  return serverCreateSchedule(teacherId, data);
}

export async function updateSchedule({
  scheduleId,
  ...data
}: import("@/server/schedules/service").UpdateScheduleInput & { scheduleId: string }) {
  return serverUpdateScheduleById(scheduleId, data);
}
