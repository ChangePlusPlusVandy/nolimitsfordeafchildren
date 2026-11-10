import { getSchedule as serverGetSchedule } from "./queries";

export async function getScheduleDetails(id: string) {
  return serverGetSchedule(id);
}
