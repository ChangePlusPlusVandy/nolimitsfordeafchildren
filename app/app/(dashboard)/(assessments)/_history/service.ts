import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  AssessmentFocusTable,
  AssessmentTable,
  TeacherProfileTable,
  UserTable,
} from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type {
  AssessmentCycleRecord as AssessmentCycle,
  AssessmentFocusWithDetails,
  AssessmentWithDetails,
} from "../_domain/types";

export class AssessmentHistoryService {
  private async getFocusesByAssessmentIds(
    assessmentIds: string[],
  ): Promise<Map<string, AssessmentFocusWithDetails[]>> {
    const focusMap = new Map<string, AssessmentFocusWithDetails[]>();

    if (assessmentIds.length === 0) {
      return focusMap;
    }

    const focusRows = await db
      .select()
      .from(AssessmentFocusTable)
      .where(inArray(AssessmentFocusTable.assessment_id, assessmentIds));

    for (const focus of focusRows) {
      const list = focusMap.get(focus.assessment_id) ?? [];
      list.push(focus);
      focusMap.set(focus.assessment_id, list);
    }

    return focusMap;
  }

  async listForStudent(
    studentId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<AssessmentCycle>> {
    const { page, limit, offset } = getPagination(query, 10, 100);
    const cycleCountResult = await db
      .select({ count: sql<number>`count(distinct ${AssessmentTable.cycle_start_date})` })
      .from(AssessmentTable)
      .where(eq(AssessmentTable.student_id, studentId));
    const total = cycleCountResult[0]?.count ?? 0;
    const cycleRows = await db
      .selectDistinct({ cycle_start_date: AssessmentTable.cycle_start_date })
      .from(AssessmentTable)
      .where(eq(AssessmentTable.student_id, studentId))
      .orderBy(desc(AssessmentTable.cycle_start_date))
      .limit(limit)
      .offset(offset);
    const cycleStartDates = cycleRows.map((row) => row.cycle_start_date);

    if (cycleStartDates.length === 0) {
      return buildPaginatedResponse([], total, page, limit);
    }

    const results = await db
      .select({
        id: AssessmentTable.id,
        student_id: AssessmentTable.student_id,
        teacher_id: AssessmentTable.teacher_id,
        cycle_start_date: AssessmentTable.cycle_start_date,
        assessment_type: AssessmentTable.assessment_type,
        teaching_focus: AssessmentTable.teaching_focus,
        summary: AssessmentTable.summary,
        score: AssessmentTable.score,
        notes: AssessmentTable.notes,
        assessed_at: AssessmentTable.assessed_at,
        created_at: AssessmentTable.created_at,
        updated_at: AssessmentTable.updated_at,
        teacher_name: UserTable.name,
      })
      .from(AssessmentTable)
      .innerJoin(TeacherProfileTable, eq(AssessmentTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(AssessmentTable.student_id, studentId),
          inArray(AssessmentTable.cycle_start_date, cycleStartDates),
        ),
      )
      .orderBy(desc(AssessmentTable.cycle_start_date), AssessmentTable.assessment_type);
    const assessmentIds = results.map((row) => row.id);
    const focusMap = await this.getFocusesByAssessmentIds(assessmentIds);
    const cycleMap = new Map<string, AssessmentCycle>();

    for (const row of results) {
      const cycleKey = row.cycle_start_date;

      if (!cycleMap.has(cycleKey)) {
        cycleMap.set(cycleKey, { cycle_start_date: cycleKey });
      }

      const cycle = cycleMap.get(cycleKey)!;
      const assessment: AssessmentWithDetails = {
        id: row.id,
        student_id: row.student_id,
        teacher_id: row.teacher_id,
        cycle_start_date: row.cycle_start_date,
        assessment_type: row.assessment_type,
        teaching_focus: row.teaching_focus,
        summary: row.summary,
        score: row.score,
        notes: row.notes,
        assessed_at: row.assessed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        focuses: (focusMap.get(row.id) ?? []).sort((a, b) => a.sort_order - b.sort_order),
        teacher: { id: row.teacher_id, name: row.teacher_name },
      };

      if (row.assessment_type === "pre") {
        cycle.pre_assessment = assessment;
      } else {
        cycle.post_assessment = assessment;
      }

      if (cycle.pre_assessment && cycle.post_assessment) {
        cycle.improvement = cycle.post_assessment.score - cycle.pre_assessment.score;
      }
    }

    const cycleOrder = new Map(
      cycleStartDates.map((cycleStartDate, index) => [cycleStartDate, index]),
    );
    const items = Array.from(cycleMap.values()).sort(
      (a, b) =>
        (cycleOrder.get(a.cycle_start_date) ?? 0) - (cycleOrder.get(b.cycle_start_date) ?? 0),
    );

    return buildPaginatedResponse(items, total, page, limit);
  }

  async getForCycle(studentId: string, cycleStartDate: string): Promise<AssessmentCycle | null> {
    const results = await db
      .select({
        id: AssessmentTable.id,
        student_id: AssessmentTable.student_id,
        teacher_id: AssessmentTable.teacher_id,
        cycle_start_date: AssessmentTable.cycle_start_date,
        assessment_type: AssessmentTable.assessment_type,
        teaching_focus: AssessmentTable.teaching_focus,
        summary: AssessmentTable.summary,
        score: AssessmentTable.score,
        notes: AssessmentTable.notes,
        assessed_at: AssessmentTable.assessed_at,
        created_at: AssessmentTable.created_at,
        updated_at: AssessmentTable.updated_at,
        teacher_name: UserTable.name,
      })
      .from(AssessmentTable)
      .innerJoin(TeacherProfileTable, eq(AssessmentTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .where(
        and(
          eq(AssessmentTable.student_id, studentId),
          eq(AssessmentTable.cycle_start_date, cycleStartDate),
        ),
      );
    const assessmentIds = results.map((row) => row.id);
    const focusMap = await this.getFocusesByAssessmentIds(assessmentIds);

    if (results.length === 0) {
      return null;
    }

    const cycle: AssessmentCycle = { cycle_start_date: cycleStartDate };

    for (const row of results) {
      const assessment: AssessmentWithDetails = {
        id: row.id,
        student_id: row.student_id,
        teacher_id: row.teacher_id,
        cycle_start_date: row.cycle_start_date,
        assessment_type: row.assessment_type,
        teaching_focus: row.teaching_focus,
        summary: row.summary,
        score: row.score,
        notes: row.notes,
        assessed_at: row.assessed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        focuses: (focusMap.get(row.id) ?? []).sort((a, b) => a.sort_order - b.sort_order),
        teacher: { id: row.teacher_id, name: row.teacher_name },
      };

      if (row.assessment_type === "pre") {
        cycle.pre_assessment = assessment;
      } else {
        cycle.post_assessment = assessment;
      }
    }

    if (cycle.pre_assessment && cycle.post_assessment) {
      cycle.improvement = cycle.post_assessment.score - cycle.pre_assessment.score;
    }

    return cycle;
  }
}
