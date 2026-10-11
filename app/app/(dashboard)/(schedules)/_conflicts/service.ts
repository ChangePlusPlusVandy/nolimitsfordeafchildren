import { and, eq, ne } from "drizzle-orm";

import { db } from "@/_platform/db";
import { ScheduleTable } from "@/_platform/db/schema";

import type { ConflictCheckInput, ConflictResult } from "../_domain/types";
import { findConflicts } from "./overlap";

export async function checkConflicts(input: ConflictCheckInput): Promise<ConflictResult> {
  const conditions = [
    eq(ScheduleTable.teacher_id, input.teacher_id),
    eq(ScheduleTable.is_active, true),
  ];

  if (input.exclude_schedule_id) {
    conditions.push(ne(ScheduleTable.id, input.exclude_schedule_id));
  }

  const existingSchedules = await db
    .select()
    .from(ScheduleTable)
    .where(and(...conditions));

  return findConflicts(input, existingSchedules);
}
