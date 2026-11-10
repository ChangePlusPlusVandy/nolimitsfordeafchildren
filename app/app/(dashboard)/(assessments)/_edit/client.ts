import type { AssessmentFocus } from "../_domain/types";
import { updateAssessment as serverUpdateAssessment } from "./actions";

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
