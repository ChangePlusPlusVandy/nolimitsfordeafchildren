"use server";

import { isParentLinkedToStudent } from "@/(dashboard)/(parents)/_domain/access";
import { getTeacherProfileIdForUser } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { getSchedule as show } from "./service";

export async function getSchedule(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const schedule = await show(id);
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
