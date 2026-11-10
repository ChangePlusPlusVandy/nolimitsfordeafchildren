import { clone } from "../_clone/service";
import { create } from "../_create/service";
import { deleteAssessment } from "../_delete/service";
import { show } from "../_detail/service";
import { update } from "../_edit/service";
import { AssessmentHistoryService } from "../_history/service";

export type {
  AssessmentFocusInput,
  AssessmentFocusWithDetails,
  CreateAssessmentInput,
  AssessmentWithDetails,
  CloneAssessmentInput,
  AssessmentCycleRecord as AssessmentCycle,
} from "./types";

export class AssessmentsService {
  async create(...args: Parameters<typeof create>) {
    return create(...args);
  }

  async listForStudent(...args: Parameters<AssessmentHistoryService["listForStudent"]>) {
    return new AssessmentHistoryService().listForStudent(...args);
  }

  async getForCycle(...args: Parameters<AssessmentHistoryService["getForCycle"]>) {
    return new AssessmentHistoryService().getForCycle(...args);
  }

  async show(...args: Parameters<typeof show>) {
    return show(...args);
  }

  async update(...args: Parameters<typeof update>) {
    return update(...args);
  }

  async clone(...args: Parameters<typeof clone>) {
    return clone(...args);
  }

  async delete(...args: Parameters<typeof deleteAssessment>) {
    return deleteAssessment(...args);
  }
}

export const assessmentsService = new AssessmentsService();
