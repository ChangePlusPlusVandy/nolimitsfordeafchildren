import { createRequest } from "../_request/service";
import { ScheduleRequests } from "../_requests/service";
import { reviewRequest } from "../_review/service";
import { teacherRespond } from "../_teacher-response/service";

export type { RequestStatus } from "./types";
export type { CreateScheduleChangeInput } from "../_request/types";
export type { ScheduleInfo, ScheduleChangeRequestWithDetails } from "../_requests/types";
export type { TeacherScheduleChangeResponseInput } from "../_teacher-response/types";

/** Compatibility facade; implementations live with their use cases. */
export class ScheduleChangeService {
  async isRequestVisibleToParent(
    ...args: Parameters<ScheduleRequests["isRequestVisibleToParent"]>
  ) {
    return new ScheduleRequests().isRequestVisibleToParent(...args);
  }

  async isRequestVisibleToTeacher(
    ...args: Parameters<ScheduleRequests["isRequestVisibleToTeacher"]>
  ) {
    return new ScheduleRequests().isRequestVisibleToTeacher(...args);
  }

  async createRequest(...args: Parameters<typeof createRequest>) {
    return createRequest(...args);
  }

  async listRequests(...args: Parameters<ScheduleRequests["listRequests"]>) {
    return new ScheduleRequests().listRequests(...args);
  }

  async listRequestsForTeacher(...args: Parameters<ScheduleRequests["listRequestsForTeacher"]>) {
    return new ScheduleRequests().listRequestsForTeacher(...args);
  }

  async showRequest(...args: Parameters<ScheduleRequests["showRequest"]>) {
    return new ScheduleRequests().showRequest(...args);
  }

  async reviewRequest(...args: Parameters<typeof reviewRequest>) {
    return reviewRequest(...args);
  }

  async teacherRespond(...args: Parameters<typeof teacherRespond>) {
    return teacherRespond(...args);
  }

  async listRequestsForParent(...args: Parameters<ScheduleRequests["listRequestsForParent"]>) {
    return new ScheduleRequests().listRequestsForParent(...args);
  }
}
