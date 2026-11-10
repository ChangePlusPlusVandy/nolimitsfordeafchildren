import { reviewScheduleChangeRequest as reviewRequest } from "./actions";

export async function reviewScheduleChangeRequest(
  id: string,
  input: { status: string; review_notes?: string },
) {
  return reviewRequest(id, {
    status: input.status,
    admin_notes: input.review_notes,
  } as never);
}
