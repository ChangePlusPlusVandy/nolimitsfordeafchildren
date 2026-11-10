import { getAvailable } from "../_available/service";
import { checkConflicts } from "../_conflicts/service";
import { createSchedule } from "../_create/service";
import { getSchedule } from "../_detail/service";
import { listSchedules } from "../_list/service";
import { updateSchedule } from "../_update/service";
import type {
  AvailableSchedulesQuery,
  ConflictCheckInput,
  CreateScheduleInput,
  ListSchedulesQuery,
  UpdateScheduleInput,
} from "./types";

export type {
  AvailableSchedulesQuery,
  ConflictCheckInput,
  ConflictResult,
  CreateScheduleInput,
  ListSchedulesQuery,
  ScheduleDetails,
  ScheduleWithDetails,
  UpdateScheduleInput,
} from "./types";
export { checkScheduleConflicts } from "../_conflicts/actions";
export { createSchedule, createTeacherSchedule } from "../_create/actions";
export { updateScheduleById, updateSchedule } from "../_update/actions";

export class SchedulesService {
  async index(query: ListSchedulesQuery) {
    return listSchedules(query);
  }

  async show(id: string) {
    return getSchedule(id);
  }

  async getAvailable(query: AvailableSchedulesQuery) {
    return getAvailable(query);
  }

  async checkConflicts(input: ConflictCheckInput) {
    return checkConflicts(input);
  }

  async create(teacherId: string, input: CreateScheduleInput) {
    return createSchedule(teacherId, input);
  }

  async update(scheduleId: string, input: UpdateScheduleInput) {
    return updateSchedule(scheduleId, input);
  }
}

export const schedulesService = new SchedulesService();
