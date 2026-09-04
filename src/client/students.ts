/**
 * Thin client data-access layer for Students.
 *
 * Names reconcile 1:1 with `src/server/students/{queries,actions}.ts`.
 */

import {
  addSibling as serverAddSibling,
  createStudent as serverCreateStudent,
  linkStudentParent as serverLinkStudentParent,
  linkStudentTeacher as serverLinkStudentTeacher,
  removeSibling as serverRemoveSibling,
  unlinkStudentParent as serverUnlinkStudentParent,
  unlinkStudentTeacher as serverUnlinkStudentTeacher,
  updateGuardianSummary as serverUpdateGuardianSummary,
  updateSibling as serverUpdateSibling,
  updateStudent as serverUpdateStudent,
} from "@/server/students/actions";
import {
  getStudent as serverGetStudent,
  listStudents as serverListStudents,
} from "@/server/students/queries";

export type {
  AddSiblingInput,
  CreateStudentInput,
  LinkParentInput,
  LinkTeacherInput,
  StudentFilters,
  UpdateSiblingInput,
  UpdateStudentInput,
} from "@/server/students/service";

export interface Student {
  id: string;
  site_id: string;
  first_name: string;
  last_name: string;
  initials: string;
  photo_url: string | null;
  dob: string;
  current_school: string | null;
  preferred_language: string;
  hearing_devices: string[];
  hearing_loss_type:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentListItem {
  id: string;
  initials: string;
  site_id: string;
  dob: string;
  is_active: boolean;
  // Only available for admins
  first_name?: string;
  last_name?: string;
}

export interface StudentDetails extends Student {
  site: {
    id: string;
    name: string;
    type: string;
  } | null;
  active_schedules?: Array<{
    id: string;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
    session?: { id: string; name: string } | null;
    site: { id: string; name: string };
    teacher: { id: string; name: string };
  }>;
  schedule_history?: Array<{
    enrollment_id: string;
    enrolled_at: string;
    ended_at: string | null;
    is_current: boolean;
    schedule: {
      id: string;
      day_of_week_mask: number;
      start_time: string;
      end_time: string;
      cycle_start_date: string;
      cycle_end_date: string;
      is_active: boolean;
      session?: { id: string; name: string } | null;
      site: { id: string; name: string };
      teacher: { id: string; name: string };
    };
  }>;
  siblings: Sibling[];
  teachers: LinkedTeacher[];
  parents: LinkedParent[];
  attendance_overview: AttendanceOverview | null;
}

export interface AttendanceRecentEntry {
  id: string;
  session_date: string;
  status: "present" | "late" | "no_show" | "cancelled";
  late_minutes: number | null;
  reason:
    | "sick"
    | "family_emergency"
    | "transportation"
    | "schedule_conflict"
    | "no_show_unknown"
    | "other"
    | null;
  reason_text: string | null;
  marked_at: string;
  schedule_id: string;
  marked_by: {
    id: string;
    name: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  } | null;
}

export interface AttendanceOverview {
  total: number;
  present: number;
  late: number;
  no_show: number;
  cancelled: number;
  attendance_rate: number;
  recent_entries: AttendanceRecentEntry[];
}

export interface Sibling {
  id: string;
  name: string;
  age: number | null;
  relationship: string;
  is_participant: boolean;
  has_hearing_loss: boolean;
  photo_url: string | null;
  notes: string | null;
}

export interface LinkedTeacher {
  link_id: string;
  teacher_id: string;
  name: string;
  email: string;
  assigned_at: string;
}

export interface LinkedParent {
  link_id: string;
  parent_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
  is_primary: boolean;
  linked_at: string;
}

export interface ListStudentsResponse {
  items: StudentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listStudents(
  params?: import("@/server/students/service").StudentFilters,
): Promise<ListStudentsResponse> {
  return serverListStudents(params as never);
}

export async function getStudentDetails(id: string): Promise<StudentDetails> {
  return serverGetStudent(id) as never;
}

export async function createStudent(
  payload: import("@/server/students/service").CreateStudentInput,
) {
  return serverCreateStudent(payload);
}

export async function updateStudent(
  payload: import("@/server/students/service").UpdateStudentInput & { id: string },
) {
  const { id, ...data } = payload;
  return serverUpdateStudent(id, data);
}

export async function addSiblingToStudent({
  studentId,
  ...data
}: import("@/server/students/service").AddSiblingInput & { studentId: string }) {
  return serverAddSibling(studentId, data);
}

export async function updateSiblingOfStudent(
  payload: import("@/server/students/service").UpdateSiblingInput & { id: string },
) {
  const { id, ...data } = payload;
  return serverUpdateSibling(id, data);
}

export async function removeSiblingFromStudent(siblingId: string) {
  return serverRemoveSibling(siblingId);
}

export async function linkTeacherToStudent({
  studentId,
  teacher_id,
}: {
  studentId: string;
  teacher_id: string;
}) {
  return serverLinkStudentTeacher(studentId, teacher_id);
}

export async function unlinkTeacherFromStudent({
  studentId,
  teacherId,
}: {
  studentId: string;
  teacherId: string;
}) {
  return serverUnlinkStudentTeacher(studentId, teacherId);
}

export async function linkParentToStudent({
  studentId,
  ...data
}: import("@/server/students/service").LinkParentInput & { studentId: string }) {
  return serverLinkStudentParent(studentId, data);
}

export async function unlinkParentFromStudent({
  studentId,
  parentId,
}: {
  studentId: string;
  parentId: string;
}) {
  return serverUnlinkStudentParent(studentId, parentId);
}

/** Update a student's guardian summary (admin/teacher). */
export async function updateGuardianSummary(studentId: string, guardianSummary: string) {
  return serverUpdateGuardianSummary(studentId, {
    guardian_summary: guardianSummary.trim() || null,
  });
}
