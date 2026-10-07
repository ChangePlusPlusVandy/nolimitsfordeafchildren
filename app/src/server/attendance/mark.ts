import { and, eq } from "drizzle-orm";

import {
  type AttendanceEntity,
  type AttendanceInsert,
  AttendanceSiblingParticipantTable,
  AttendanceTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { sendNoShowAlerts } from "@/server/attendance/alerts";
import {
  normalizeSiblingParticipantIds,
  replaceSiblingParticipants,
} from "@/server/attendance/siblings";
import type {
  AbsenceReason,
  ClearAttendanceInput,
  MarkAttendanceInput,
  UpdateAttendanceInput,
} from "@/server/attendance/types";
import { BadRequestError } from "@/server/shared/errors";

export async function clearAttendance(input: ClearAttendanceInput): Promise<void> {
  const [attendance] = await db
    .select({ id: AttendanceTable.id })
    .from(AttendanceTable)
    .where(
      and(
        eq(AttendanceTable.student_id, input.student_id),
        eq(AttendanceTable.schedule_id, input.schedule_id),
        eq(AttendanceTable.session_date, input.session_date),
      ),
    )
    .limit(1);

  if (!attendance) {
    return;
  }

  // Remove participant links and the mark atomically to restore an unmarked session.
  await db.batch([
    db
      .delete(AttendanceSiblingParticipantTable)
      .where(eq(AttendanceSiblingParticipantTable.attendance_id, attendance.id)),
    db.delete(AttendanceTable).where(eq(AttendanceTable.id, attendance.id)),
  ]);
}

export async function markAttendance(input: MarkAttendanceInput): Promise<AttendanceEntity> {
  const siblingParticipantIds = normalizeSiblingParticipantIds(input.sibling_participant_ids);

  if (input.status === "late") {
    if (![10, 15, 30].includes(input.late_minutes || 0)) {
      throw new BadRequestError("Late minutes must be one of: 10, 15, or 30");
    }
  }

  const existing = await db
    .select()
    .from(AttendanceTable)
    .where(
      and(
        eq(AttendanceTable.student_id, input.student_id),
        eq(AttendanceTable.schedule_id, input.schedule_id),
        eq(AttendanceTable.session_date, input.session_date),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const shouldSendNoShowAlert = existing[0]!.status !== "no_show" && input.status === "no_show";

    const result = await db
      .update(AttendanceTable)
      .set({
        status: input.status,
        late_minutes: input.status === "late" ? input.late_minutes || null : null,
        reason: input.reason || null,
        reason_text: input.reason_text || null,
        marked_by: input.marked_by,
        marked_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(AttendanceTable.id, existing[0]!.id))
      .returning();

    await replaceSiblingParticipants(result[0]!.id, input.student_id, siblingParticipantIds);

    if (shouldSendNoShowAlert) {
      await sendNoShowAlerts({
        student_id: input.student_id,
        schedule_id: input.schedule_id,
        session_date: input.session_date,
        reason: input.reason,
      });
    }

    return result[0]!;
  }

  const newAttendance: AttendanceInsert = {
    student_id: input.student_id,
    schedule_id: input.schedule_id,
    session_date: input.session_date,
    status: input.status,
    late_minutes: input.status === "late" ? input.late_minutes || null : null,
    reason: input.reason || null,
    reason_text: input.reason_text || null,
    marked_by: input.marked_by,
    marked_at: new Date(),
  };

  const result = await db.insert(AttendanceTable).values(newAttendance).returning();

  await replaceSiblingParticipants(result[0]!.id, input.student_id, siblingParticipantIds);

  if (input.status === "no_show") {
    await sendNoShowAlerts({
      student_id: input.student_id,
      schedule_id: input.schedule_id,
      session_date: input.session_date,
      reason: input.reason,
    });
  }

  return result[0]!;
}

export async function updateAttendance(
  id: string,
  input: UpdateAttendanceInput,
  markedBy: string,
): Promise<AttendanceEntity | null> {
  const existing = await db
    .select()
    .from(AttendanceTable)
    .where(eq(AttendanceTable.id, id))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  if (input.status === "late") {
    if (![10, 15, 30].includes(input.late_minutes || 0)) {
      throw new BadRequestError("Late minutes must be one of: 10, 15, or 30");
    }
  }

  const updateData: Partial<AttendanceInsert> = {
    updated_at: new Date(),
    marked_by: markedBy,
    marked_at: new Date(),
  };

  if (input.status !== undefined) updateData.status = input.status;
  if (input.late_minutes !== undefined) updateData.late_minutes = input.late_minutes;
  if (input.reason !== undefined) updateData.reason = input.reason;
  if (input.reason_text !== undefined) updateData.reason_text = input.reason_text;

  if (input.status && input.status !== "late" && input.late_minutes === undefined) {
    updateData.late_minutes = null;
  }

  const shouldSendNoShowAlert = existing[0]!.status !== "no_show" && input.status === "no_show";

  const result = await db
    .update(AttendanceTable)
    .set(updateData)
    .where(eq(AttendanceTable.id, id))
    .returning();

  if (input.sibling_participant_ids !== undefined) {
    const siblingParticipantIds = normalizeSiblingParticipantIds(input.sibling_participant_ids);
    await replaceSiblingParticipants(id, existing[0]!.student_id, siblingParticipantIds);
  }

  if (shouldSendNoShowAlert) {
    await sendNoShowAlerts({
      student_id: existing[0]!.student_id,
      schedule_id: existing[0]!.schedule_id,
      session_date: existing[0]!.session_date,
      reason: (input.reason as AbsenceReason | null | undefined) ?? undefined,
    });
  }

  return result[0] ?? null;
}
