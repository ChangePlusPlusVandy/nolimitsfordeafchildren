import { createRequest } from "../_request/service";
import { MakeupRequests } from "../_requests/service";
import { reviewRequest } from "../_review/service";
import { createSession } from "../_schedule-session/service";
import {
  isTeacherAuthorizedForSession,
  listSessionsForTeacher,
  markSessionAttendance,
} from "../_teacher-sessions/service";

export type { AbsenceReason, CreateMakeupRequestInput } from "../_request/types";
export type { CreateMakeupSessionInput } from "../_schedule-session/types";
export type { AttendanceStatus, MakeupSessionWithDetails } from "../_teacher-sessions/types";
export type { RequestStatus } from "./types";
export type { MakeupRequestWithDetails } from "../_requests/types";

/** Compatibility facade; implementations live with their use cases. */
export class MakeupService {
  async isRequestVisibleToParent(...args: Parameters<MakeupRequests["isRequestVisibleToParent"]>) {
    return new MakeupRequests().isRequestVisibleToParent(...args);
  }

  async isTeacherAuthorizedForSession(...args: Parameters<typeof isTeacherAuthorizedForSession>) {
    return isTeacherAuthorizedForSession(...args);
  }

  async createRequest(...args: Parameters<typeof createRequest>) {
    return createRequest(...args);
  }

  async listRequests(...args: Parameters<MakeupRequests["listRequests"]>) {
    return new MakeupRequests().listRequests(...args);
  }

  async showRequest(...args: Parameters<MakeupRequests["showRequest"]>) {
    return new MakeupRequests().showRequest(...args);
  }

  async reviewRequest(...args: Parameters<typeof reviewRequest>) {
    return reviewRequest(...args);
  }

  async createSession(...args: Parameters<typeof createSession>) {
    return createSession(...args);
  }

  async listSessionsForTeacher(...args: Parameters<typeof listSessionsForTeacher>) {
    return listSessionsForTeacher(...args);
  }

  async markSessionAttendance(...args: Parameters<typeof markSessionAttendance>) {
    return markSessionAttendance(...args);
  }

  async listRequestsForParent(...args: Parameters<MakeupRequests["listRequestsForParent"]>) {
    return new MakeupRequests().listRequestsForParent(...args);
  }
}
