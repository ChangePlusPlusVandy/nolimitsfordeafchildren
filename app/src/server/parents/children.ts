import { and, asc, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";

import {
  BulletinTable,
  DocumentTable,
  LocationTable,
  MakeupRequestTable,
  ParentStudentLinkTable,
  ScheduleChangeRequestTable,
  SiblingTable,
  StudentTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { AttendanceService } from "@/server/attendance/service";
import { getAudiogramCompliance } from "@/server/parents/audiogram-compliance";
import { getMissedSessions } from "@/server/parents/missed-sessions";
import { getParentProfileId } from "@/server/parents/parent-access";
import {
  getCurrentScheduleId,
  getNextSession,
  getScheduledSessions,
} from "@/server/parents/schedule-sessions";
import type {
  ChildDetails,
  LinkedChild,
  PaginatedQuery,
  PaginatedResponse,
} from "@/server/parents/types";
import { buildPaginatedResponse, getPagination } from "@/server/shared/pagination";

export async function myChildren(
  parentUserId: string,
  query: PaginatedQuery = {},
): Promise<PaginatedResponse<LinkedChild>> {
  const { page, limit, offset } = getPagination(query, 20, 100);
  const attendanceService = new AttendanceService();

  const parentProfileId = await getParentProfileId(parentUserId);
  if (!parentProfileId) {
    return buildPaginatedResponse([], 0, page, limit);
  }

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(ParentStudentLinkTable)
    .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        isNull(ParentStudentLinkTable.revoked_at),
        eq(StudentTable.is_active, true),
      ),
    );

  const total = countRows[0]?.count ?? 0;

  const linkedStudents = await db
    .select({
      student_id: StudentTable.id,
      first_name: StudentTable.first_name,
      last_name: StudentTable.last_name,
      initials: StudentTable.initials,
      photo_url: StudentTable.photo_url,
      dob: StudentTable.dob,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
    })
    .from(ParentStudentLinkTable)
    .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
    .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        isNull(ParentStudentLinkTable.revoked_at),
        eq(StudentTable.is_active, true),
      ),
    )
    .orderBy(asc(StudentTable.last_name), asc(StudentTable.first_name), asc(StudentTable.id))
    .limit(limit)
    .offset(offset);

  const items: LinkedChild[] = [];

  for (const student of linkedStudents) {
    const summary = await attendanceService.getSummary(student.student_id);
    const currentScheduleId = await getCurrentScheduleId(student.student_id);

    const pendingMakeups = await db
      .select({ count: sql<number>`count(*)` })
      .from(MakeupRequestTable)
      .where(
        and(
          eq(MakeupRequestTable.student_id, student.student_id),
          eq(MakeupRequestTable.status, "pending"),
        ),
      );

    const pendingScheduleChanges = await db
      .select({ count: sql<number>`count(*)` })
      .from(ScheduleChangeRequestTable)
      .where(
        and(
          eq(ScheduleChangeRequestTable.student_id, student.student_id),
          eq(ScheduleChangeRequestTable.status, "pending"),
        ),
      );

    const pendingRequests =
      (pendingMakeups[0]?.count || 0) + (pendingScheduleChanges[0]?.count || 0);

    const nextSession = await getNextSession(student.student_id);
    const audiogramCompliance = await getAudiogramCompliance(student.student_id);

    items.push({
      id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      initials: student.initials,
      photo_url: student.photo_url,
      dob: student.dob,
      site: {
        id: student.site_id,
        name: student.site_name,
      },
      current_schedule_id: currentScheduleId,
      next_session: nextSession,
      attendance_summary: {
        total: summary.total,
        present: summary.present,
        attendance_rate: summary.attendance_rate,
      },
      pending_requests: pendingRequests,
      audiogram_compliance: audiogramCompliance,
    });
  }

  return buildPaginatedResponse(items, total, page, limit);
}

export async function childDetail(
  parentUserId: string,
  studentId: string,
): Promise<ChildDetails | null> {
  const attendanceService = new AttendanceService();

  const parentProfileId = await getParentProfileId(parentUserId);
  if (!parentProfileId) {
    return null;
  }

  const link = await db
    .select()
    .from(ParentStudentLinkTable)
    .where(
      and(
        eq(ParentStudentLinkTable.parent_id, parentProfileId),
        eq(ParentStudentLinkTable.student_id, studentId),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    )
    .limit(1);

  if (link.length === 0) {
    return null;
  }

  const student = await db
    .select({
      id: StudentTable.id,
      first_name: StudentTable.first_name,
      last_name: StudentTable.last_name,
      initials: StudentTable.initials,
      photo_url: StudentTable.photo_url,
      dob: StudentTable.dob,
      preferred_language: StudentTable.preferred_language,
      hearing_devices: StudentTable.hearing_devices,
      hearing_loss_type: StudentTable.hearing_loss_type,
      current_school: StudentTable.current_school,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
    })
    .from(StudentTable)
    .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
    .where(eq(StudentTable.id, studentId))
    .limit(1);

  if (student.length === 0) {
    return null;
  }

  const s = student[0]!;

  const summary = await attendanceService.getSummary(studentId);
  const upcomingSessions = await getScheduledSessions(studentId, 14, "future");
  const recentSessions = await getScheduledSessions(studentId, 14, "past");

  const pendingMakeups = await db
    .select({ count: sql<number>`count(*)` })
    .from(MakeupRequestTable)
    .where(
      and(eq(MakeupRequestTable.student_id, studentId), eq(MakeupRequestTable.status, "pending")),
    );

  const pendingScheduleChanges = await db
    .select({ count: sql<number>`count(*)` })
    .from(ScheduleChangeRequestTable)
    .where(
      and(
        eq(ScheduleChangeRequestTable.student_id, studentId),
        eq(ScheduleChangeRequestTable.status, "pending"),
      ),
    );

  const missedSessions = await getMissedSessions(studentId);
  const audiogramCompliance = await getAudiogramCompliance(studentId);

  const bulletins = await db
    .select({
      id: BulletinTable.id,
      title: BulletinTable.title,
      body: BulletinTable.body,
      publish_at: BulletinTable.publish_at,
    })
    .from(BulletinTable)
    .where(
      and(
        sql`(${BulletinTable.scope} = 'global' OR ${BulletinTable.site_id} = ${s.site_id})`,
        sql`(${BulletinTable.role_target} = 'all' OR ${BulletinTable.role_target} = 'parent')`,
        or(isNull(BulletinTable.publish_at), lte(BulletinTable.publish_at, new Date())),
        or(isNull(BulletinTable.expire_at), gt(BulletinTable.expire_at, new Date())),
      ),
    )
    .orderBy(desc(BulletinTable.publish_at))
    .limit(5);

  const approvedDocuments = await db
    .select({
      id: DocumentTable.id,
      document_type: DocumentTable.document_type,
      file_name: DocumentTable.file_name,
      file_url: DocumentTable.file_url,
      created_at: DocumentTable.created_at,
      review_status: DocumentTable.review_status,
      session_date: DocumentTable.session_date,
      next_due_date: DocumentTable.next_due_date,
    })
    .from(DocumentTable)
    .where(
      and(
        eq(DocumentTable.entity_type, "student"),
        eq(DocumentTable.entity_id, studentId),
        eq(DocumentTable.review_status, "approved"),
      ),
    )
    .orderBy(desc(DocumentTable.created_at))
    .limit(25);

  const siblings = await db
    .select({
      id: SiblingTable.id,
      name: SiblingTable.name,
      age: SiblingTable.age,
      relationship: SiblingTable.relationship,
      is_participant: SiblingTable.is_participant,
      has_hearing_loss: SiblingTable.has_hearing_loss,
    })
    .from(SiblingTable)
    .where(eq(SiblingTable.student_id, studentId))
    .orderBy(SiblingTable.name);

  return {
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    initials: s.initials,
    photo_url: s.photo_url,
    dob: s.dob,
    preferred_language: s.preferred_language,
    hearing_devices: s.hearing_devices,
    hearing_loss_type: s.hearing_loss_type,
    current_school: s.current_school,
    site: {
      id: s.site_id,
      name: s.site_name,
    },
    upcoming_sessions: upcomingSessions,
    recent_sessions: recentSessions,
    attendance_summary: summary,
    pending_makeup_requests: pendingMakeups[0]?.count || 0,
    pending_schedule_change_requests: pendingScheduleChanges[0]?.count || 0,
    missed_sessions: missedSessions,
    relevant_bulletins: bulletins,
    approved_documents: approvedDocuments,
    audiogram_compliance: audiogramCompliance,
    siblings,
  };
}
