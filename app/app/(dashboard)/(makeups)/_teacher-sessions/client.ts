import { markMakeupSessionAttendance as markAttendance } from "./actions";
import { listTeacherMakeupSessions } from "./queries";

export async function listMakeupSessionsForTeacher(
  teacherId: string,
  params?: { date?: string; page?: number; limit?: number },
) {
  return listTeacherMakeupSessions(teacherId, params ?? {});
}

export async function markMakeupSessionAttendance(
  sessionId: string,
  input: { status: "present" | "late" | "no_show" | "cancelled" },
) {
  return markAttendance(sessionId, input);
}
