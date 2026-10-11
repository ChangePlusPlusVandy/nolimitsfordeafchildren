import { and, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  MakeupRequestTable,
  ScheduleTable,
  StudentTable,
  type MakeupRequestEntity,
  type MakeupRequestInsert,
} from "@/_platform/db/schema";
import { ConflictError, NotFoundError } from "@/_shared/server/errors";

import type { CreateMakeupRequestInput } from "./types";

export async function createRequest(input: CreateMakeupRequestInput): Promise<MakeupRequestEntity> {
  const student = await db
    .select()
    .from(StudentTable)
    .where(eq(StudentTable.id, input.student_id))
    .limit(1);

  if (student.length === 0) {
    throw new NotFoundError("Student not found");
  }

  const schedule = await db
    .select()
    .from(ScheduleTable)
    .where(eq(ScheduleTable.id, input.original_schedule_id))
    .limit(1);

  if (schedule.length === 0) {
    throw new NotFoundError("Schedule not found");
  }

  const existing = await db
    .select()
    .from(MakeupRequestTable)
    .where(
      and(
        eq(MakeupRequestTable.student_id, input.student_id),
        eq(MakeupRequestTable.original_schedule_id, input.original_schedule_id),
        eq(MakeupRequestTable.original_session_date, input.original_session_date),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError("A makeup request already exists for this session");
  }

  const newRequest: MakeupRequestInsert = {
    student_id: input.student_id,
    original_session_date: input.original_session_date,
    original_schedule_id: input.original_schedule_id,
    reason: input.reason,
    reason_text: input.reason_text || null,
    preferred_dates: input.preferred_dates || null,
    status: "pending",
    requested_by: input.requested_by,
    requested_at: new Date(),
  };

  const result = await db.insert(MakeupRequestTable).values(newRequest).returning();

  return result[0]!;
}
