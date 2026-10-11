import { availableSchedules } from "@/(dashboard)/(schedules)/_domain/queries";

import { createScheduleChangeRequest as createRequest } from "./actions";
import type { CreateScheduleChangeInput } from "./types";

export async function createScheduleChangeRequest(
  input: Omit<CreateScheduleChangeInput, "requested_by">,
) {
  return createRequest(input);
}

export async function getAvailableSchedules(params?: {
  site_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return availableSchedules(params as never);
}
