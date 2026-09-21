/**
 * Thin client data-access layer for Teachers ("my day", profiles, schedules).
 *
 * Names reconcile 1:1 with `src/server/teachers/{queries,actions}.ts`.
 */

import {
  assignTeacherLocation as serverAssignTeacherLocation,
  createTeacher as serverCreateTeacher,
  createTeacherSchedule as serverCreateTeacherSchedule,
  postTeacherSickDayNotice as serverPostTeacherSickDayNotice,
  unassignTeacherLocation as serverUnassignTeacherLocation,
  updateSchedule as serverUpdateSchedule,
  updateTeacher as serverUpdateTeacher,
} from "@/server/teachers/actions";
import {
  getTeacher as serverGetTeacher,
  getTeacherLocations as serverGetTeacherLocations,
  getTeacherStudents as serverGetTeacherStudents,
  getTeachersMeDay as serverGetTeachersMeDay,
  listTeachers as serverListTeachers,
} from "@/server/teachers/queries";

export type {
  AgeGroupSpecialty,
  CreateScheduleInput,
  CreateTeacherInput,
  ListTeachersQuery,
  UpdateScheduleInput,
  UpdateTeacherInput,
} from "@/server/teachers/service";

export interface Teacher {
  id: string;
  user_id: string;
  primary_site_id: string | null;
  bio: string | null;
  photo_url: string | null;
  qualifications: string | null;
  credentials: string | null;
  age_group_specialty: import("@/server/teachers/service").AgeGroupSpecialty | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
  };
  primarySite?: {
    id: string;
    name: string;
  } | null;
}

export interface TeacherDetails extends Teacher {
  locations: Array<{ id: string; name: string }>;
  schedules: Array<{
    id: string;
    teacher_id: string;
    site_id: string;
    session_id: string | null;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
    is_active: boolean;
    site: { id: string; name: string };
    session?: { id: string; name: string } | null;
  }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    site: { id: string; name: string };
  }>;
}

export interface ListTeachersResponse {
  items: Teacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AttendanceStatus = "present" | "late" | "no_show" | "cancelled";
export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

export interface SessionForDay {
  session_date: string;
  schedule_id: string;
  student_id: string;
  student_initials: string;
  student_first_name: string;
  student_last_name: string;
  start_time: string;
  end_time: string;
  site_id: string;
  site_name: string;
  attendance?: {
    id: string;
    status: AttendanceStatus;
    late_minutes?: number | null;
    reason: AbsenceReason | null;
    reason_text: string | null;
    marked_at: string;
    sibling_participants?: Array<{
      sibling_id: string;
      name: string;
      relationship: string;
    }>;
  } | null;
}

export interface MyDayResponse {
  sessions: SessionForDay[];
}

export interface Schedule {
  id: string;
  teacher_id: string;
  site_id: string;
  session_id: string | null;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function listTeachers(
  params?: import("@/server/teachers/service").ListTeachersQuery,
): Promise<ListTeachersResponse> {
  return serverListTeachers(params as never) as never;
}

export async function getTeacherDetails(id: string): Promise<TeacherDetails> {
  return serverGetTeacher(id) as never;
}

export async function getMyDay(params?: {
  date?: string;
  start_date?: string;
  end_date?: string;
}): Promise<MyDayResponse> {
  return serverGetTeachersMeDay(params as never) as never;
}

export async function getTeacherStudents(id: string, params?: { page?: number; limit?: number }) {
  return serverGetTeacherStudents(id, params as never);
}

export async function getTeacherLocations(teacherId: string) {
  return serverGetTeacherLocations(teacherId);
}

export async function createTeacher(
  payload: import("@/server/teachers/service").CreateTeacherInput,
) {
  return serverCreateTeacher(payload);
}

export async function updateTeacher(
  payload: import("@/server/teachers/service").UpdateTeacherInput & { id: string },
) {
  const { id, ...data } = payload;
  return serverUpdateTeacher(id, data);
}

export async function createTeacherSchedule({
  teacherId,
  ...data
}: import("@/server/teachers/service").CreateScheduleInput & { teacherId: string }) {
  return serverCreateTeacherSchedule(teacherId, data);
}

export async function updateTeacherSchedule({
  scheduleId,
  ...data
}: import("@/server/teachers/service").UpdateScheduleInput & { scheduleId: string }) {
  return serverUpdateSchedule(scheduleId, data);
}

export async function assignLocationToTeacher({
  teacherId,
  locationId,
}: {
  teacherId: string;
  locationId: string;
}) {
  await serverAssignTeacherLocation(teacherId, locationId);
  return { success: true };
}

export async function unassignLocationFromTeacher({
  teacherId,
  locationId,
}: {
  teacherId: string;
  locationId: string;
}) {
  await serverUnassignTeacherLocation(teacherId, locationId);
  return { success: true };
}

/** Post a parent-facing location announcement for a sick day (teacher). */
export async function postTeacherSickDayNotice(input: {
  notice_date?: string;
  note?: string;
  site_id?: string;
}) {
  return serverPostTeacherSickDayNotice(input);
}

/**
 * Helper to decode day of week mask into readable format.
 */
export function decodeDayMask(mask: number): string[] {
  const days: string[] = [];
  if (mask & 1) days.push("Sun");
  if (mask & 2) days.push("Mon");
  if (mask & 4) days.push("Tue");
  if (mask & 8) days.push("Wed");
  if (mask & 16) days.push("Thu");
  if (mask & 32) days.push("Fri");
  if (mask & 64) days.push("Sat");
  return days;
}

/**
 * Helper to encode days into mask.
 */
export function encodeDayMask(days: string[]): number {
  let mask = 0;
  if (days.includes("Sun")) mask |= 1;
  if (days.includes("Mon")) mask |= 2;
  if (days.includes("Tue")) mask |= 4;
  if (days.includes("Wed")) mask |= 8;
  if (days.includes("Thu")) mask |= 16;
  if (days.includes("Fri")) mask |= 32;
  if (days.includes("Sat")) mask |= 64;
  return mask;
}

/**
 * Predefined schedule patterns.
 */
export const SCHEDULE_PATTERNS = {
  MWS: { label: "Mon/Wed/Sat", mask: 74 }, // 2 + 8 + 64
  TThS: { label: "Tue/Thu/Sat", mask: 84 }, // 4 + 16 + 64
};

/**
 * Age group specialty labels.
 */
export const AGE_GROUP_LABELS: Record<
  import("@/server/teachers/service").AgeGroupSpecialty,
  string
> = {
  infant: "Infant (0-1)",
  toddler: "Toddler (1-3)",
  preschool: "Preschool (3-5)",
  elementary: "Elementary (5-11)",
  middle_school: "Middle School (11-14)",
  high_school: "High School (14-18)",
  young_adult: "Young Adult (18-21)",
  all_ages: "All Ages",
};
