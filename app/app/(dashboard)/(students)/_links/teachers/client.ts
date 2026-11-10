import {
  linkStudentTeacher as serverLinkStudentTeacher,
  unlinkStudentTeacher as serverUnlinkStudentTeacher,
} from "./actions";
import {
  getStudentTeachers as serverGetStudentTeachers,
  listLinkableTeachers as serverListLinkableTeachers,
} from "./queries";

export async function getStudentTeachers(
  studentId: string,
  params?: { page?: number; limit?: number },
) {
  return serverGetStudentTeachers(studentId, params);
}

export async function listLinkableTeachers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return serverListLinkableTeachers(params);
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
