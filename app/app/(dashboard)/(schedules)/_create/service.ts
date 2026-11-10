import { eq } from "drizzle-orm";

import {
  isTeacherAssignedToLocation,
  requireTeacherProfileId,
} from "@/(dashboard)/(teachers)/_domain/access";
import { db } from "@/_platform/db";
import {
  type ScheduleEntity,
  type ScheduleInsert,
  ScheduleTable,
  SessionTable,
} from "@/_platform/db/schema";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/_shared/server/errors";

import { checkConflicts } from "../_conflicts/service";
import type { CreateScheduleInput } from "../_domain/types";

export async function createSchedule(
  teacherId: string,
  input: CreateScheduleInput,
): Promise<ScheduleEntity> {
  const teacherProfileId = await requireTeacherProfileId(teacherId);

  const isAssigned = await isTeacherAssignedToLocation(teacherProfileId, input.site_id);
  if (!isAssigned) {
    throw new ForbiddenError("Teacher is not assigned to this location");
  }

  if (input.session_id) {
    const session = await db
      .select({ id: SessionTable.id, is_archived: SessionTable.is_archived })
      .from(SessionTable)
      .where(eq(SessionTable.id, input.session_id))
      .limit(1);

    if (!session[0]) {
      throw new NotFoundError("Session not found");
    }

    if (session[0].is_archived) {
      throw new BadRequestError("Cannot assign an archived session to a schedule");
    }
  }

  const conflictResult = await checkConflicts({
    teacher_id: teacherProfileId,
    day_of_week_mask: input.day_of_week_mask,
    start_time: input.start_time,
    end_time: input.end_time,
    cycle_start_date: input.cycle_start_date,
    cycle_end_date: input.cycle_end_date,
  });

  if (conflictResult.hasConflict) {
    throw new ConflictError(
      `Schedule conflicts with existing schedules: ${conflictResult.conflicts.map((c) => c.id).join(", ")}`,
    );
  }

  const newSchedule: ScheduleInsert = {
    teacher_id: teacherProfileId,
    site_id: input.site_id,
    session_id: input.session_id || null,
    day_of_week_mask: input.day_of_week_mask,
    start_time: input.start_time,
    end_time: input.end_time,
    cycle_start_date: input.cycle_start_date,
    cycle_end_date: input.cycle_end_date,
    is_active: true,
  };

  const result = await db.insert(ScheduleTable).values(newSchedule).returning();

  return result[0]!;
}
