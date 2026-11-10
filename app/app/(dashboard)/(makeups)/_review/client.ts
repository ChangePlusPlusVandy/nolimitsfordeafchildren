import { reviewMakeupRequest as reviewRequest } from "./actions";

export async function reviewMakeupRequest(
  id: string,
  input: { status: "approved" | "denied"; review_notes?: string },
) {
  return reviewRequest(id, input);
}
