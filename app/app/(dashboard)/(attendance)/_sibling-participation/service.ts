import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  AttendanceSiblingParticipantTable,
  AttendanceTable,
  LocationTable,
  ScheduleTable,
  SiblingTable,
  StudentTable,
} from "@/_platform/db/schema";

import type { SiblingParticipationReportItem } from "../_domain/types";
import { summarizeParticipation } from "./summary";

export async function getSiblingParticipationReport(query: {
  date_from?: string;
  date_to?: string;
  site_id?: string;
}): Promise<{ items: SiblingParticipationReportItem[]; total: number }> {
  const conditions = [];
  if (query.date_from) {
    conditions.push(gte(AttendanceTable.session_date, query.date_from));
  }
  if (query.date_to) {
    conditions.push(lte(AttendanceTable.session_date, query.date_to));
  }
  if (query.site_id) {
    conditions.push(eq(ScheduleTable.site_id, query.site_id));
  }

  const rows = await db
    .select({
      sibling_id: SiblingTable.id,
      sibling_name: SiblingTable.name,
      student_id: StudentTable.id,
      student_initials: StudentTable.initials,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
      status: AttendanceTable.status,
    })
    .from(AttendanceSiblingParticipantTable)
    .innerJoin(
      AttendanceTable,
      eq(AttendanceSiblingParticipantTable.attendance_id, AttendanceTable.id),
    )
    .innerJoin(StudentTable, eq(AttendanceTable.student_id, StudentTable.id))
    .innerJoin(SiblingTable, eq(AttendanceSiblingParticipantTable.sibling_id, SiblingTable.id))
    .innerJoin(ScheduleTable, eq(AttendanceTable.schedule_id, ScheduleTable.id))
    .innerJoin(LocationTable, eq(ScheduleTable.site_id, LocationTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(AttendanceTable.session_date));

  return summarizeParticipation(rows);
}
