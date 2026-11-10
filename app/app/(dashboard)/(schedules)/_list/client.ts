import type { ListSchedulesQuery } from "../_domain/types";
import { listSchedules as serverListSchedules } from "./queries";

export async function listSchedules(params?: ListSchedulesQuery) {
  return serverListSchedules(params);
}
