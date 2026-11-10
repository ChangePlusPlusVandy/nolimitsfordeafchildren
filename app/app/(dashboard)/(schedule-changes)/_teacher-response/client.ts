import { teacherRespond } from "./actions";

export async function teacherRespondToScheduleChange(
  id: string,
  input: { response_status: "available" | "unavailable" | "conditional"; notes?: string },
) {
  return teacherRespond(id, input);
}
