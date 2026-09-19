"use server";
import { isParentLinkedToStudent } from "@/server/parents/parent-access";
import {
  type AvailableSchedulesQuery,
  type ListSchedulesQuery,
  schedulesService,
} from "@/server/schedules/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";
import { getTeacherProfileIdForUser } from "@/server/shared/student-access";

/**
 * GET /v1/schedules — any authenticated user.
 */
export async function listSchedules(query: ListSchedulesQuery = {}) {
  await requireRole();
  return await schedulesService.index(query);
}

/**
 * GET /v1/schedules/available — parent | administrator (browse for schedule
 * change requests).
 */
export async function availableSchedules(query: AvailableSchedulesQuery = {}) {
  await requireRole("parent", "administrator");
  return await schedulesService.getAvailable(query);
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
  const user = await requireRole("administrator", "teacher", "parent");
  const schedule = await schedulesService.show(id);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  if (user.role === "administrator") {
    return schedule;
  }

  if (user.role === "teacher") {
    const profileId = await getTeacherProfileIdForUser(user.id);
    if (profileId === schedule.teacher_id) {
      return schedule;
    }
    throw new NotFoundError("Schedule not found");
  }

  const linked = await Promise.all(
    schedule.enrolledStudents.map((student) => isParentLinkedToStudent(user.id, student.id)),
  );
  if (!linked.some(Boolean)) {
    throw new NotFoundError("Schedule not found");
  }

  return {
    ...schedule,
    enrolledStudents: schedule.enrolledStudents.map((student) => ({
      ...student,
      first_name: student.initials,
      last_name: "",
    })),
  };
}
