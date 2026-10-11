import type { AssessmentFocus } from "../_domain/types";
import { createAssessment as serverCreateAssessment } from "./actions";

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
