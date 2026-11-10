import { and, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  ScheduleChangeRequestEventTable,
  ScheduleChangeRequestTable,
  ScheduleTable,
  StudentTable,
  type ScheduleChangeRequestEntity,
  type ScheduleChangeRequestInsert,
} from "@/_platform/db/schema";
import { ConflictError, NotFoundError } from "@/_shared/server/errors";

import type { CreateScheduleChangeInput } from "./types";

export async function createRequest(
  input: CreateScheduleChangeInput,
): Promise<ScheduleChangeRequestEntity> {
  const student = await db
    .select()
    .from(StudentTable)
    .where(eq(StudentTable.id, input.student_id))
    .limit(1);

  if (student.length === 0) {
    throw new NotFoundError("Student not found");
  }

  const currentSchedule = await db
    .select()
    .from(ScheduleTable)
    .where(eq(ScheduleTable.id, input.current_schedule_id))
    .limit(1);

  if (currentSchedule.length === 0) {
    throw new NotFoundError("Current schedule not found");
  }

  if (input.requested_schedule_id) {
    const requestedSchedule = await db
      .select()
      .from(ScheduleTable)
      .where(eq(ScheduleTable.id, input.requested_schedule_id))
      .limit(1);

    if (requestedSchedule.length === 0) {
      throw new NotFoundError("Requested schedule not found");
    }
  }

  const existing = await db
    .select()
    .from(ScheduleChangeRequestTable)
    .where(
      and(
        eq(ScheduleChangeRequestTable.student_id, input.student_id),
        eq(ScheduleChangeRequestTable.status, "pending"),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError("A pending schedule change request already exists for this student");
  }

  const newRequest: ScheduleChangeRequestInsert = {
    student_id: input.student_id,
    current_schedule_id: input.current_schedule_id,
    requested_schedule_id: input.requested_schedule_id || null,
    preferred_times: input.preferred_times || null,
    flexibility_notes: input.flexibility_notes || null,
    reason: input.reason,
    status: "pending",
    requested_by: input.requested_by,
    requested_at: new Date(),
  };

  const result = await db.insert(ScheduleChangeRequestTable).values(newRequest).returning();

  if (result[0]) {
    await db.insert(ScheduleChangeRequestEventTable).values({
      schedule_change_request_id: result[0].id,
      event_type: "created",
      from_status: null,
      to_status: "pending",
      actor_user_id: input.requested_by,
      notes: input.reason,
    });
  }

  return result[0]!;
}
