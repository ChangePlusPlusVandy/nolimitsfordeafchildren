/**
 * Thin client data-access layer for Assessments (pre/post per 10-week cycle).
 *
 * Names reconcile 1:1 with `src/server/assessments/{queries,actions}.ts`.
 */

import {
  cloneAssessment as serverCloneAssessment,
  createAssessment as serverCreateAssessment,
  deleteAssessment as serverDeleteAssessment,
  updateAssessment as serverUpdateAssessment,
} from "@/server/assessments/actions";
import { listStudentAssessments as serverListStudentAssessments } from "@/server/assessments/queries";

export interface Assessment {
  id: string;
  student_id: string;
  teacher_id: string;
  cycle_start_date: string;
  assessment_type: "pre" | "post";
  teaching_focus: string;
  summary: string | null;
  focuses?: AssessmentFocus[];
  score: number;
  notes: string | null;
  assessed_at: string;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    name: string;
  };
}

export interface AssessmentFocus {
  id?: string;
  goal: string;
  score: number;
  max_score: number;
  sort_order?: number;
}

export interface AssessmentCycle {
  cycle_start_date: string;
  pre_assessment?: Assessment;
  post_assessment?: Assessment;
  improvement?: number;
}

export interface PaginatedAssessmentsResponse {
  items: AssessmentCycle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAssessmentsForStudent(
  studentId: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedAssessmentsResponse> {
  return serverListStudentAssessments(studentId, params) as never;
}

export async function createAssessment(
  studentId: string,
  input: {
    cycle_start_date: string;
    assessment_type: "pre" | "post";
    teaching_focus: string;
    focuses?: AssessmentFocus[];
    summary?: string;
    score: number;
    notes?: string;
  },
) {
  return serverCreateAssessment(studentId, input as never);
}

export async function updateAssessment(
  id: string,
  data: {
    teaching_focus?: string;
    summary?: string;
    focuses?: AssessmentFocus[];
    score?: number;
    notes?: string;
  },
) {
  return serverUpdateAssessment(id, data as never);
}

export async function deleteAssessment(id: string) {
  return serverDeleteAssessment(id);
}

export async function cloneAssessment(
  id: string,
  payload?: {
    cycle_start_date?: string;
    assessment_type?: "pre" | "post";
    teaching_focus?: string;
    focuses?: AssessmentFocus[];
    score?: number;
    notes?: string;
  },
) {
  return serverCloneAssessment(id, payload as never);
}
