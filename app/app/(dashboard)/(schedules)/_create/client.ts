import type { CreateScheduleInput } from "../_domain/types";
import {
  createSchedule as serverCreateSchedule,
  createTeacherSchedule as serverCreateTeacherSchedule,
} from "./actions";

export async function createSchedule({
  teacherId,
  ...data
}: CreateScheduleInput & { teacherId: string }) {
  return serverCreateSchedule(teacherId, data);
}

export async function createTeacherSchedule({
  teacherId,
  ...data
}: CreateScheduleInput & { teacherId: string }) {
  return serverCreateTeacherSchedule(teacherId, data);
}
