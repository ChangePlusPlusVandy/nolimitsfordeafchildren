import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  EnrollmentTable,
  ScheduleChangeRequestEventTable,
  ScheduleChangeRequestTable,
  type RequestStatus,
  type ScheduleChangeRequestEntity,
} from "@/_platform/db/schema";
import { BadRequestError, ConflictError } from "@/_shared/server/errors";

export async function reviewRequest(
  requestId: string,
  adminId: string,
  status: "approved" | "denied" | "negotiating",
  reviewNotes?: string,
): Promise<ScheduleChangeRequestEntity | null> {
  const existing = await db
    .select()
    .from(ScheduleChangeRequestTable)
    .where(eq(ScheduleChangeRequestTable.id, requestId))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const currentStatus = existing[0]!.status;
  const reviewableStatuses: RequestStatus[] = ["pending", "negotiating"];

  if (!reviewableStatuses.includes(currentStatus as RequestStatus)) {
    throw new ConflictError("Request has already been finalized");
  }

  // Approval transfers the active enrollment to the requested schedule.
  if (status === "approved") {
    const request = existing[0]!;

    if (!request.requested_schedule_id) {
      throw new BadRequestError("Cannot approve without a requested schedule");
    }

    await db
      .update(EnrollmentTable)
      .set({
        ended_at: new Date(),
        updated_at: new Date(),
      })
      .where(
        and(
          eq(EnrollmentTable.student_id, request.student_id),
          eq(EnrollmentTable.schedule_id, request.current_schedule_id),
          isNull(EnrollmentTable.ended_at),
        ),
      );

    await db.insert(EnrollmentTable).values({
      student_id: request.student_id,
      schedule_id: request.requested_schedule_id,
      enrolled_at: new Date(),
    });
  }

  const result = await db
    .update(ScheduleChangeRequestTable)
    .set({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date(),
      review_notes: reviewNotes || null,
      updated_at: new Date(),
    })
    .where(eq(ScheduleChangeRequestTable.id, requestId))
    .returning();

  if (result[0]) {
    await db.insert(ScheduleChangeRequestEventTable).values({
      schedule_change_request_id: requestId,
      event_type: "status_change",
      from_status: currentStatus,
      to_status: status,
      actor_user_id: adminId,
      notes: reviewNotes || null,
    });
  }

  return result[0] ?? null;
}
