import { Service } from "typedi";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";
import {
  AssessmentTable,
  AssessmentFocusTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
  type AssessmentEntity,
  type AssessmentInsert,
  type AssessmentFocusEntity,
  type AssessmentFocusInsert,
} from "@/db/schema";

export interface AssessmentFocusInput {
  goal: string;
  score: number;
  max_score: number;
}

export interface AssessmentFocusWithDetails extends AssessmentFocusEntity {}

export interface CreateAssessmentInput {
  student_id: string;
  teacher_id: string;
  cycle_start_date: string;
  assessment_type: "pre" | "post";
  teaching_focus: string;
  summary?: string;
  focuses?: AssessmentFocusInput[];
  score: number;
  notes?: string;
}

export interface AssessmentWithDetails extends AssessmentEntity {
  focuses?: AssessmentFocusWithDetails[];
  teacher?: {
    id: string;
    name: string;
  };
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
}

export interface CloneAssessmentInput {
  cycle_start_date?: string;
  assessment_type?: "pre" | "post";
  teaching_focus?: string;
  summary?: string | null;
  focuses?: AssessmentFocusInput[];
  score?: number;
  notes?: string | null;
}

export interface AssessmentCycle {
  cycle_start_date: string;
  pre_assessment?: AssessmentWithDetails;
  post_assessment?: AssessmentWithDetails;
  improvement?: number;
}

function validateAssessmentFocuses(focuses?: AssessmentFocusInput[]): AssessmentFocusInput[] {
  if (!focuses || focuses.length === 0) {
    return [];
  }

  if (focuses.length > 4) {
    throw new Error("Assessment can include up to 4 teaching focuses");
  }

  for (const focus of focuses) {
    if (!focus.goal?.trim()) {
      throw new Error("Each teaching focus must include a goal");
    }
    if (focus.max_score <= 0) {
      throw new Error("Each teaching focus max score must be greater than 0");
    }
    if (focus.score < 0 || focus.score > focus.max_score) {
      throw new Error("Each teaching focus score must be between 0 and max score");
    }
  }

  return focuses;
}

function summarizeFocusesForLegacyFields(focuses: AssessmentFocusInput[]): {
  teaching_focus: string;
  score: number;
} {
  if (focuses.length === 0) {
    return {
      teaching_focus: "General",
      score: 0,
    };
  }

  const totalScore = focuses.reduce((sum, focus) => sum + focus.score, 0);
  const totalMax = focuses.reduce((sum, focus) => sum + focus.max_score, 0);
  const scaledScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 20) : 0;

  return {
    teaching_focus: focuses.map((focus) => focus.goal.trim()).join(" | "),
    score: Math.min(20, Math.max(0, scaledScore)),
  };
}

@Service()
export class AssessmentsService {
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

  /**
   * Create a new assessment
   */
  async create(input: CreateAssessmentInput): Promise<AssessmentEntity> {
    const normalizedFocuses = validateAssessmentFocuses(input.focuses);
    const hasFocuses = normalizedFocuses.length > 0;

    const normalizedTeachingFocus = hasFocuses
      ? summarizeFocusesForLegacyFields(normalizedFocuses).teaching_focus
      : input.teaching_focus;
    const normalizedScore = hasFocuses
      ? summarizeFocusesForLegacyFields(normalizedFocuses).score
      : input.score;

    // Validate score is 0-20
    if (normalizedScore < 0 || normalizedScore > 20) {
      throw new Error("Score must be between 0 and 20");
    }

    // Verify student exists
    const student = await db
      .select()
      .from(StudentTable)
      .where(eq(StudentTable.id, input.student_id))
      .limit(1);

    if (student.length === 0) {
      throw new Error("Student not found");
    }

    // Verify teacher exists
    const teacher = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.id, input.teacher_id))
      .limit(1);

    if (teacher.length === 0) {
      throw new Error("Teacher not found");
    }

    // Check if assessment already exists for this cycle/type
    const existing = await db
      .select()
      .from(AssessmentTable)
      .where(
        and(
          eq(AssessmentTable.student_id, input.student_id),
          eq(AssessmentTable.cycle_start_date, input.cycle_start_date),
          eq(AssessmentTable.assessment_type, input.assessment_type),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`A ${input.assessment_type} assessment already exists for this cycle`);
    }

    const newAssessment: AssessmentInsert = {
      student_id: input.student_id,
      teacher_id: input.teacher_id,
      cycle_start_date: input.cycle_start_date,
      assessment_type: input.assessment_type,
      teaching_focus: normalizedTeachingFocus,
      summary: input.summary || null,
      score: normalizedScore,
      notes: input.notes || null,
      assessed_at: new Date(),
    };

    const result = await db.insert(AssessmentTable).values(newAssessment).returning();

    if (hasFocuses && result[0]) {
      const focusRows: AssessmentFocusInsert[] = normalizedFocuses.map((focus, index) => ({
        assessment_id: result[0]!.id,
        goal: focus.goal.trim(),
        score: focus.score,
        max_score: focus.max_score,
        sort_order: index,
      }));

      await db.insert(AssessmentFocusTable).values(focusRows);
    }

    return result[0]!;
  }

  /**
   * List assessments for a student, grouped by cycle
   */
  async listForStudent(
    studentId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<AssessmentCycle>> {
    const { page, limit, offset } = getPagination(query, 10, 100);

    const cycleCountResult = await db
      .select({ count: sql<number>`count(distinct ${AssessmentTable.cycle_start_date})::int` })
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

    // Group by cycle
    const cycleMap = new Map<string, AssessmentCycle>();

    for (const row of results) {
      const cycleKey = row.cycle_start_date;

      if (!cycleMap.has(cycleKey)) {
        cycleMap.set(cycleKey, {
          cycle_start_date: cycleKey,
        });
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
        teacher: {
          id: row.teacher_id,
          name: row.teacher_name,
        },
      };

      if (row.assessment_type === "pre") {
        cycle.pre_assessment = assessment;
      } else {
        cycle.post_assessment = assessment;
      }

      // Calculate improvement if both exist
      if (cycle.pre_assessment && cycle.post_assessment) {
        cycle.improvement = cycle.post_assessment.score - cycle.pre_assessment.score;
      }
    }

    const cycleOrder = new Map(cycleStartDates.map((cycleStartDate, index) => [cycleStartDate, index]));
    const items = Array.from(cycleMap.values()).sort(
      (a, b) => (cycleOrder.get(a.cycle_start_date) ?? 0) - (cycleOrder.get(b.cycle_start_date) ?? 0),
    );

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get assessments for a specific cycle
   */
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

    const cycle: AssessmentCycle = {
      cycle_start_date: cycleStartDate,
    };

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
        teacher: {
          id: row.teacher_id,
          name: row.teacher_name,
        },
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

  /**
   * Get a single assessment by ID
   */
  async show(id: string): Promise<AssessmentWithDetails | null> {
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
        student_initials: StudentTable.initials,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
      })
      .from(AssessmentTable)
      .innerJoin(TeacherProfileTable, eq(AssessmentTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .innerJoin(StudentTable, eq(AssessmentTable.student_id, StudentTable.id))
      .where(eq(AssessmentTable.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0]!;
    const focusRows = await db
      .select()
      .from(AssessmentFocusTable)
      .where(eq(AssessmentFocusTable.assessment_id, row.id));

    return {
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
      focuses: focusRows.sort((a, b) => a.sort_order - b.sort_order),
      teacher: {
        id: row.teacher_id,
        name: row.teacher_name,
      },
      student: {
        id: row.student_id,
        initials: row.student_initials,
        first_name: row.student_first_name,
        last_name: row.student_last_name,
      },
    };
  }

  /**
   * Update an assessment
   */
  async update(
    id: string,
    teacherId: string,
    data: Partial<
      Pick<CreateAssessmentInput, "teaching_focus" | "summary" | "focuses" | "score" | "notes">
    >,
  ): Promise<AssessmentEntity | null> {
    // Verify the assessment exists and belongs to this teacher
    const existing = await db
      .select()
      .from(AssessmentTable)
      .where(and(eq(AssessmentTable.id, id), eq(AssessmentTable.teacher_id, teacherId)))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const normalizedFocuses = data.focuses === undefined ? undefined : validateAssessmentFocuses(data.focuses);

    let normalizedTeachingFocus = data.teaching_focus;
    let normalizedScore = data.score;

    if (normalizedFocuses && normalizedFocuses.length > 0) {
      const legacySummary = summarizeFocusesForLegacyFields(normalizedFocuses);
      normalizedTeachingFocus = legacySummary.teaching_focus;
      normalizedScore = legacySummary.score;
    }

    // Validate score if provided
    if (normalizedScore !== undefined && (normalizedScore < 0 || normalizedScore > 20)) {
      throw new Error("Score must be between 0 and 20");
    }

    const { focuses: _focuses, ...assessmentUpdateData } = data;

    const result = await db
      .update(AssessmentTable)
      .set({
        ...assessmentUpdateData,
        ...(normalizedTeachingFocus !== undefined ? { teaching_focus: normalizedTeachingFocus } : {}),
        ...(normalizedScore !== undefined ? { score: normalizedScore } : {}),
        updated_at: new Date(),
      })
      .where(eq(AssessmentTable.id, id))
      .returning();

    if (normalizedFocuses !== undefined) {
      await db.delete(AssessmentFocusTable).where(eq(AssessmentFocusTable.assessment_id, id));

      if (normalizedFocuses.length > 0) {
        const focusRows: AssessmentFocusInsert[] = normalizedFocuses.map((focus, index) => ({
          assessment_id: id,
          goal: focus.goal.trim(),
          score: focus.score,
          max_score: focus.max_score,
          sort_order: index,
        }));

        await db.insert(AssessmentFocusTable).values(focusRows);
      }
    }

    return result[0] ?? null;
  }

  async clone(
    assessmentId: string,
    teacherId: string,
    overrides: CloneAssessmentInput = {},
  ): Promise<AssessmentEntity> {
    const existing = await db
      .select()
      .from(AssessmentTable)
      .where(and(eq(AssessmentTable.id, assessmentId), eq(AssessmentTable.teacher_id, teacherId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Assessment not found or you don't have permission to clone it");
    }

    const source = existing[0]!;
    const sourceFocuses = await db
      .select()
      .from(AssessmentFocusTable)
      .where(eq(AssessmentFocusTable.assessment_id, source.id));

    const input: CreateAssessmentInput = {
      student_id: source.student_id,
      teacher_id: teacherId,
      cycle_start_date: overrides.cycle_start_date ?? source.cycle_start_date,
      assessment_type:
        overrides.assessment_type ?? (source.assessment_type === "pre" ? "post" : "pre"),
      teaching_focus: overrides.teaching_focus ?? source.teaching_focus,
      summary:
        overrides.summary === undefined
          ? (source.summary ?? undefined)
          : (overrides.summary ?? undefined),
      focuses:
        overrides.focuses ??
        sourceFocuses
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((focus) => ({
            goal: focus.goal,
            score: focus.score,
            max_score: focus.max_score,
          })),
      score: overrides.score ?? source.score,
      notes:
        overrides.notes === undefined ? (source.notes ?? undefined) : (overrides.notes ?? undefined),
    };

    return this.create(input);
  }

  /**
   * Delete an assessment
   */
  async delete(id: string, teacherId?: string): Promise<boolean> {
    const conditions = [eq(AssessmentTable.id, id)];

    if (teacherId) {
      conditions.push(eq(AssessmentTable.teacher_id, teacherId));
    }

    const existing = await db
      .select({ id: AssessmentTable.id })
      .from(AssessmentTable)
      .where(and(...conditions));

    if (existing.length === 0) {
      return false;
    }

    const assessmentIds = existing.map((row) => row.id);
    await db.delete(AssessmentFocusTable).where(inArray(AssessmentFocusTable.assessment_id, assessmentIds));

    const result = await db
      .delete(AssessmentTable)
      .where(and(...conditions))
      .returning();

    return result.length > 0;
  }
}
