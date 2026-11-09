import { MakeupRequests } from "../_requests/service";

export {
  assertTeacherOwnsMakeupSession,
  isTeacherAuthorizedForSession,
} from "../_teacher-sessions/service";

export async function isRequestVisibleToParent(requestId: string, parentUserId: string) {
  return new MakeupRequests().isRequestVisibleToParent(requestId, parentUserId);
}
