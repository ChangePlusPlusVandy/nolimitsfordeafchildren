"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { TeacherProfileTable } from "@/db/schema";
import { db } from "@/lib/db";
import { AssessmentsService, type CreateAssessmentInput } from "@/server/assessments/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError, NotFoundError } from "@/server/shared/errors";

const focusSchema = z.object({
  goal: z.string().min(1).max(500),
  score: z.number().int().min(0).max(20),
  max_score: z.number().int().min(1).max(20),
});

const createAssessmentSchema = z
  .object({
    cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    assessment_type: z.enum(["pre", "post"]),
    teaching_focus: z.string().min(1).max(500),
    summary: z.string().max(2000).nullable().optional(),
    focuses: z.array(focusSchema).optional(),
    score: z.number().int().min(0).max(20),
    notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();

const updateAssessmentSchema = z
  .object({
    teaching_focus: z.string().min(1).max(500).optional(),
    focuses: z.array(focusSchema).optional(),
    summary: z.string().max(2000).nullable().optional(),
    score: z.number().int().min(0).max(20).optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();

const cloneAssessmentSchema = z
  .object({
    cycle_start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    assessment_type: z.enum(["pre", "post"]).optional(),
    teaching_focus: z.string().min(1).max(500).optional(),
    summary: z.string().max(2000).nullable().optional(),
    focuses: z.array(focusSchema).optional(),
    score: z.number().int().min(0).max(20).optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();

/** Map service validation messages onto 400/409 as the controller did. */
function mapAssessmentError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes("already exists"))
      throw new HttpError(409, "CONFLICT", error.message);
    if (error.message.includes("Score must be"))
      throw new HttpError(400, "BAD_REQUEST", error.message);
    if (error.message.includes("teaching focus") || error.message.includes("max score")) {
      throw new HttpError(400, "BAD_REQUEST", error.message);
    }
  }
  throw error;
}

async function requireTeacherProfileId(currentUserId: string, verb: string): Promise<string> {
  const teacherProfile = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, currentUserId))
    .limit(1);

  if (teacherProfile.length === 0) {
    throw new HttpError(403, "FORBIDDEN", `Only teachers can ${verb} assessments`);
  }
  return teacherProfile[0].id;
}

/**
 * POST /v1/students/:studentId/assessments — create (teacher).
 */
export async function createAssessment(
  studentId: string,
  input: Omit<CreateAssessmentInput, "student_id" | "teacher_id">,
) {
  const currentUser = await requireRole("teacher");
  const parsed = createAssessmentSchema.parse(input) as Omit<
    CreateAssessmentInput,
    "student_id" | "teacher_id"
  >;

  const teacherId = await requireTeacherProfileId(currentUser.id, "create");

  try {
    return await new AssessmentsService().create({
      student_id: studentId,
      teacher_id: teacherId,
      ...parsed,
    });
  } catch (error) {
    mapAssessmentError(error);
  }
}

/**
 * PATCH /v1/assessments/:id — update (teacher; must own the assessment).
 */
export async function updateAssessment(
  id: string,
  input: {
    teaching_focus?: string;
    focuses?: Array<{ goal: string; score: number; max_score: number }>;
    summary?: string;
    score?: number;
    notes?: string;
  },
) {
  const currentUser = await requireRole("teacher");
  const parsed = updateAssessmentSchema.parse(input) as Partial<
    Pick<CreateAssessmentInput, "teaching_focus" | "summary" | "focuses" | "score" | "notes">
  >;

  const teacherId = await requireTeacherProfileId(currentUser.id, "update");

  try {
    const assessment = await new AssessmentsService().update(id, teacherId, parsed);
    if (!assessment) {
      throw new NotFoundError("Assessment not found or you don't have permission to update it");
    }
    return assessment;
  } catch (error) {
    mapAssessmentError(error);
  }
}

/**
 * DELETE /v1/assessments/:id — administrator | teacher (teachers must own).
 */
export async function deleteAssessment(id: string) {
  const currentUser = await requireRole("administrator", "teacher");

  let teacherId: string | undefined;
  if (currentUser.role !== "administrator") {
    teacherId = await requireTeacherProfileId(currentUser.id, "delete");
  }

  const deleted = await new AssessmentsService().delete(id, teacherId);
  if (!deleted) {
    throw new NotFoundError("Assessment not found or you don't have permission to delete it");
  }
  return { success: true };
}

/**
 * POST /v1/assessments/:id/clone — clone an assessment into a new cycle
 * (teacher).
 */
export async function cloneAssessment(
  id: string,
  input: {
    cycle_start_date?: string;
    assessment_type?: "pre" | "post";
    teaching_focus?: string;
    summary?: string | null;
    focuses?: Array<{ goal: string; score: number; max_score: number }>;
    score?: number;
    notes?: string | null;
  },
) {
  const currentUser = await requireRole("teacher");
  const parsed = cloneAssessmentSchema.parse(input) as {
    cycle_start_date?: string;
    assessment_type?: "pre" | "post";
    teaching_focus?: string;
    summary?: string | null;
    focuses?: Array<{ goal: string; score: number; max_score: number }>;
    score?: number;
    notes?: string | null;
  };

  const teacherId = await requireTeacherProfileId(currentUser.id, "clone");

  try {
    return await new AssessmentsService().clone(id, teacherId, parsed);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("permission") || error.message.includes("not found")) {
        throw new HttpError(404, "NOT_FOUND", error.message);
      }
    }
    mapAssessmentError(error);
  }
}
