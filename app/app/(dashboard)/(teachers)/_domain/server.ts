import { createTeacher } from "../_create/service";
import { getTeacher } from "../_detail/service";
import { updateTeacher } from "../_edit/service";
import { listTeachers } from "../_list/service";
import {
  assignTeacherToLocation,
  getTeacherLocations,
  isTeacherAssignedToLocation,
  unassignTeacherFromLocation,
} from "../_locations/service";
import { myDay } from "../_my-day/service";
import { resolveTeacherProfileId } from "../_resolve/service";
import { getTeacherStudents } from "../_students/service";
import type { CreateTeacherInput, ListTeachersQuery, UpdateTeacherInput } from "./types";

export type {
  AgeGroupSpecialty,
  CreateScheduleInput,
  CreateTeacherInput,
  ListTeachersQuery,
  TeacherDetailsRecord as TeacherDetails,
  TeacherWithUser,
  UpdateScheduleInput,
  UpdateTeacherInput,
} from "./types";
export { createTeacher } from "../_create/actions";
export { updateTeacher } from "../_edit/actions";
export { assignTeacherLocation, unassignTeacherLocation } from "../_locations/actions";
export { postTeacherSickDayNotice } from "../_sick-day/actions";
export { createTeacherSchedule, updateSchedule } from "@/(dashboard)/(schedules)/_domain/server";

// Keep existing callers on the same service contract while slices own the work.
export class TeachersService {
  resolveTeacherProfileId = resolveTeacherProfileId;
  getTeacherLocations = getTeacherLocations;
  assignTeacherToLocation = assignTeacherToLocation;
  unassignTeacherFromLocation = unassignTeacherFromLocation;
  isTeacherAssignedToLocation = isTeacherAssignedToLocation;

  async index(query: ListTeachersQuery) {
    return listTeachers(query);
  }

  async show(id: string) {
    return getTeacher(id);
  }

  async create(input: CreateTeacherInput) {
    return createTeacher(input);
  }

  async update(id: string, input: UpdateTeacherInput) {
    return updateTeacher(id, input);
  }

  async students(id: string, query: { page?: number; limit?: number }) {
    return getTeacherStudents(id, query);
  }

  async myDay(query: {
    date?: string;
    start_date?: string;
    end_date?: string;
    teacher_id?: string;
  }) {
    return myDay(query);
  }
}

export const teachersService = new TeachersService();
