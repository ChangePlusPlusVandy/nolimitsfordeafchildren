import {
  endEnrollment as serverEndEnrollment,
  reenrollStudent as serverReenrollStudent,
} from "./actions";

export async function endEnrollment({
  scheduleId,
  enrollmentId,
}: {
  scheduleId: string;
  enrollmentId: string;
}) {
  return serverEndEnrollment(scheduleId, enrollmentId);
}

export async function reenrollStudent({
  scheduleId,
  studentId,
}: {
  scheduleId: string;
  studentId: string;
}) {
  return serverReenrollStudent(scheduleId, studentId);
}
