import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  ScheduleChangeRequestEventTable,
  ScheduleChangeRequestTable,
  ScheduleTable,
  TeacherProfileTable,
  type RequestStatus,
  type ScheduleChangeRequestEntity,
} from "@/_platform/db/schema";
import { ForbiddenError, NotFoundError } from "@/_shared/server/errors";

import type { TeacherScheduleChangeResponseInput } from "./types";

export async function teacherRespond(
  requestId: string,
  teacherUserId: string,
  input: TeacherScheduleChangeResponseInput,
): Promise<ScheduleChangeRequestEntity | null> {
  const existing = await db
    .select()
    .from(ScheduleChangeRequestTable)
    .where(eq(ScheduleChangeRequestTable.id, requestId))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const request = existing[0]!;

  const teacherProfile = await db
    .select({ id: TeacherProfileTable.id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, teacherUserId))
    .limit(1);

  if (teacherProfile.length === 0) {
    throw new NotFoundError("Teacher profile not found");
  }

  const currentSchedule = await db
    .select({ teacher_id: ScheduleTable.teacher_id })
    .from(ScheduleTable)
    .where(eq(ScheduleTable.id, request.current_schedule_id))
    .limit(1);

  const requestedSchedule = request.requested_schedule_id
    ? await db
        .select({ teacher_id: ScheduleTable.teacher_id })
        .from(ScheduleTable)
        .where(eq(ScheduleTable.id, request.requested_schedule_id))
        .limit(1)
    : [];

  const teacherProfileId = teacherProfile[0]!.id;
  const canRespondCurrent = currentSchedule[0]?.teacher_id === teacherProfileId;
  const canRespondRequested = requestedSchedule[0]?.teacher_id === teacherProfileId;

  if (!canRespondCurrent && !canRespondRequested) {
    throw new ForbiddenError("Teacher is not assigned to either schedule in this request");
  }

  const nextStatus: RequestStatus =
    request.status === "pending" ? "negotiating" : (request.status as RequestStatus);

  const result = await db
    .update(ScheduleChangeRequestTable)
    .set({
      status: nextStatus,
      teacher_response_status: input.response_status,
      teacher_response_notes: input.notes || null,
      teacher_responded_by: teacherUserId,
      teacher_responded_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(ScheduleChangeRequestTable.id, requestId))
    .returning();

  if (result[0]) {
    await db.insert(ScheduleChangeRequestEventTable).values({
      schedule_change_request_id: requestId,
      event_type: "teacher_response",
      from_status: request.status,
      to_status: nextStatus,
      actor_user_id: teacherUserId,
      notes: input.notes || input.response_status,
    });
  }

  return result[0] ?? null;
}
