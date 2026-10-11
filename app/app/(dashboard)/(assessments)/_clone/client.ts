import type { AssessmentFocus } from "../_domain/types";
import { cloneAssessment as serverCloneAssessment } from "./actions";

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
