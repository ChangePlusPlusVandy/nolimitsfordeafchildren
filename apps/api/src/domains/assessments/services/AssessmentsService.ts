import { Service } from "typedi";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  AssessmentTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
  type AssessmentEntity,
  type AssessmentInsert,
} from "@/db/schema";

export interface CreateAssessmentInput {
  student_id: string;
  teacher_id: string;
  cycle_start_date: string;
  assessment_type: "pre" | "post";
  teaching_focus: string;
  score: number;
  notes?: string;
}

export interface AssessmentWithDetails extends AssessmentEntity {
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

export interface AssessmentCycle {
  cycle_start_date: string;
  pre_assessment?: AssessmentWithDetails;
  post_assessment?: AssessmentWithDetails;
  improvement?: number;
}

@Service()
export class AssessmentsService {
  /**
   * Create a new assessment
   */
  async create(input: CreateAssessmentInput): Promise<AssessmentEntity> {
    // Validate score is 0-20
    if (input.score < 0 || input.score > 20) {
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
          eq(AssessmentTable.assessment_type, input.assessment_type)
        )
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
      teaching_focus: input.teaching_focus,
      score: input.score,
      notes: input.notes || null,
      assessed_at: new Date(),
    };

    const result = await db
      .insert(AssessmentTable)
      .values(newAssessment)
      .returning();

    return result[0]!;
  }

  /**
   * List assessments for a student, grouped by cycle
   */
  async listForStudent(studentId: string): Promise<AssessmentCycle[]> {
    const results = await db
      .select({
        id: AssessmentTable.id,
        student_id: AssessmentTable.student_id,
        teacher_id: AssessmentTable.teacher_id,
        cycle_start_date: AssessmentTable.cycle_start_date,
        assessment_type: AssessmentTable.assessment_type,
        teaching_focus: AssessmentTable.teaching_focus,
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
      .where(eq(AssessmentTable.student_id, studentId))
      .orderBy(desc(AssessmentTable.cycle_start_date), AssessmentTable.assessment_type);

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
        score: row.score,
        notes: row.notes,
        assessed_at: row.assessed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
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

    return Array.from(cycleMap.values());
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
          eq(AssessmentTable.cycle_start_date, cycleStartDate)
        )
      );

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
        score: row.score,
        notes: row.notes,
        assessed_at: row.assessed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
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
    return {
      id: row.id,
      student_id: row.student_id,
      teacher_id: row.teacher_id,
      cycle_start_date: row.cycle_start_date,
      assessment_type: row.assessment_type,
      teaching_focus: row.teaching_focus,
      score: row.score,
      notes: row.notes,
      assessed_at: row.assessed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
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
    data: Partial<Pick<CreateAssessmentInput, "teaching_focus" | "score" | "notes">>
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

    // Validate score if provided
    if (data.score !== undefined && (data.score < 0 || data.score > 20)) {
      throw new Error("Score must be between 0 and 20");
    }

    const result = await db
      .update(AssessmentTable)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(AssessmentTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Delete an assessment
   */
  async delete(id: string, teacherId?: string): Promise<boolean> {
    const conditions = [eq(AssessmentTable.id, id)];
    
    if (teacherId) {
      conditions.push(eq(AssessmentTable.teacher_id, teacherId));
    }

    const result = await db
      .delete(AssessmentTable)
      .where(and(...conditions))
      .returning();

    return result.length > 0;
  }
}
