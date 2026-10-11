import type { ConflictCheckInput } from "../_domain/types";
import { checkScheduleConflicts as serverCheckScheduleConflicts } from "./actions";

export async function checkScheduleConflicts(input: ConflictCheckInput) {
  return serverCheckScheduleConflicts(input);
}
