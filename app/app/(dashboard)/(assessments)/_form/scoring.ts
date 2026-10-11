import { BadRequestError } from "@/_shared/server/errors";

import type { AssessmentFocusInput } from "../_domain/types";

const MAX_FOCUSES = 4;
const MAX_SCORE = 20;

export function validateFocuses(focuses?: AssessmentFocusInput[]): AssessmentFocusInput[] {
  if (!focuses || focuses.length === 0) {
    return [];
  }

  if (focuses.length > MAX_FOCUSES) {
    throw new BadRequestError("Assessment can include up to 4 teaching focuses");
  }

  for (const focus of focuses) {
    if (!focus.goal?.trim()) {
      throw new BadRequestError("Each teaching focus must include a goal");
    }
    if (focus.max_score <= 0) {
      throw new BadRequestError("Each teaching focus max score must be greater than 0");
    }
    if (focus.score < 0 || focus.score > focus.max_score) {
      throw new BadRequestError("Each teaching focus score must be between 0 and max score");
    }
  }

  return focuses;
}

export function summarizeFocuses(focuses: AssessmentFocusInput[]): {
  teaching_focus: string;
  score: number;
} {
  if (focuses.length === 0) {
    return { teaching_focus: "General", score: 0 };
  }

  const totalScore = focuses.reduce((sum, focus) => sum + focus.score, 0);
  const totalMax = focuses.reduce((sum, focus) => sum + focus.max_score, 0);
  const scaledScore = totalMax > 0 ? Math.round((totalScore / totalMax) * MAX_SCORE) : 0;

  return {
    teaching_focus: focuses.map((focus) => focus.goal.trim()).join(" | "),
    score: Math.min(MAX_SCORE, Math.max(0, scaledScore)),
  };
}
