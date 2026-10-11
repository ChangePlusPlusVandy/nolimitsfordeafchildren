import type { UpdateScheduleInput } from "../_domain/types";
import {
  updateScheduleById as serverUpdateScheduleById,
  updateSchedule as serverUpdateSchedule,
} from "./actions";

export async function updateSchedule({
  scheduleId,
  ...data
}: UpdateScheduleInput & { scheduleId: string }) {
  return serverUpdateScheduleById(scheduleId, data);
}

export async function updateTeacherSchedule({
  scheduleId,
  ...data
}: UpdateScheduleInput & { scheduleId: string }) {
  return serverUpdateSchedule(scheduleId, data);
}
