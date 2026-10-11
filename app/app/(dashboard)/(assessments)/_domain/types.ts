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

export interface AssessmentFocusInput {
  goal: string;
  score: number;
  max_score: number;
}

export interface AssessmentFocusWithDetails extends AssessmentFocusInput {
  id: string;
  assessment_id: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

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

export interface AssessmentWithDetails extends Omit<
  Assessment,
  "focuses" | "assessed_at" | "created_at" | "updated_at"
> {
  assessed_at: Date;
  created_at: Date;
  updated_at: Date;
  focuses?: AssessmentFocusWithDetails[];
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

export interface AssessmentCycleRecord {
  cycle_start_date: string;
  pre_assessment?: AssessmentWithDetails;
  post_assessment?: AssessmentWithDetails;
  improvement?: number;
}
