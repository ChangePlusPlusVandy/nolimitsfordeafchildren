import { getTeacherStudents as serverGetTeacherStudents } from "./queries";

export async function getTeacherStudents(id: string, params?: { page?: number; limit?: number }) {
  return serverGetTeacherStudents(id, params as never);
}
