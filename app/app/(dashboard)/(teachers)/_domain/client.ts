export type {
  AgeGroupSpecialty,
  CreateScheduleInput,
  CreateTeacherInput,
  ListTeachersQuery,
  UpdateScheduleInput,
  UpdateTeacherInput,
  Teacher,
  TeacherDetails,
  ListTeachersResponse,
  AttendanceStatus,
  AbsenceReason,
  SessionForDay,
  MyDayResponse,
  Schedule,
} from "./types";
export { listTeachers } from "../_list/client";
export { getTeacherDetails } from "../_detail/client";
export { getMyDay } from "../_my-day/client";
export { getTeacherStudents } from "../_students/client";
export {
  getTeacherLocations,
  assignLocationToTeacher,
  unassignLocationFromTeacher,
} from "../_locations/client";
export { createTeacher } from "../_create/client";
export { updateTeacher } from "../_edit/client";
export { postTeacherSickDayNotice } from "../_sick-day/client";
export { AGE_GROUP_LABELS } from "./labels";
export {
  createTeacherSchedule,
  updateTeacherSchedule,
  decodeDayMask,
  encodeDayMask,
  SCHEDULE_PATTERNS,
} from "@/(dashboard)/(schedules)/_domain/client";
