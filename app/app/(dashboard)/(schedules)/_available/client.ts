import type { AvailableSchedulesQuery } from "../_domain/types";
import { availableSchedules as serverAvailableSchedules } from "./queries";

export async function getAvailableSchedules(params?: AvailableSchedulesQuery) {
  return serverAvailableSchedules(params);
}
