import { ScheduleRequests } from "../_requests/service";

export async function isRequestVisibleToParent(requestId: string, parentUserId: string) {
  return new ScheduleRequests().isRequestVisibleToParent(requestId, parentUserId);
}

export async function isRequestVisibleToTeacher(requestId: string, teacherUserId: string) {
  return new ScheduleRequests().isRequestVisibleToTeacher(requestId, teacherUserId);
}
