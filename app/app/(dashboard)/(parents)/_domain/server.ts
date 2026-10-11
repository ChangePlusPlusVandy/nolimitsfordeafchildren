import { isParentLinkedToStudent } from "../_access/service";
import { getMissedSessions } from "../_children/missed-sessions";
import { childDetail, myChildren } from "../_children/service";
import type {
  ChildDetails,
  DirectoryPerson,
  LinkedChild,
  PaginatedQuery,
  PaginatedResponse,
  ParentZipReportGroup,
} from "../_children/types";
import { directory } from "../_directory/service";
import { zipReport } from "../_zip-report/service";

export type {
  AudiogramCompliance,
  AudiogramComplianceStatus,
  ChildDetails,
  ChildScheduleSession,
  DirectoryPerson,
  LinkedChild,
  ParentZipReportGroup,
  ParentZipReportItem,
} from "../_children/types";

export { getMissedSessions } from "../_children/missed-sessions";
export { getAudiogramCompliance } from "../_children/audiogram-compliance";
export {
  getCurrentScheduleId,
  getNextSession,
  getScheduledSessions,
} from "../_children/schedule-sessions";

/** Compatibility facade; implementations live with their use cases. */
export class ParentsService {
  async directory(
    parentUserId: string,
    query: PaginatedQuery = {},
  ): Promise<PaginatedResponse<DirectoryPerson>> {
    return directory(parentUserId, query);
  }

  async zipReport(query: PaginatedQuery = {}): Promise<PaginatedResponse<ParentZipReportGroup>> {
    return zipReport(query);
  }

  async myChildren(
    parentUserId: string,
    query: PaginatedQuery = {},
  ): Promise<PaginatedResponse<LinkedChild>> {
    return myChildren(parentUserId, query);
  }

  async childDetail(parentUserId: string, studentId: string): Promise<ChildDetails | null> {
    return childDetail(parentUserId, studentId);
  }

  async getMissedSessionsForStudent(studentId: string): Promise<ChildDetails["missed_sessions"]> {
    return getMissedSessions(studentId);
  }

  async isParentLinkedToStudent(parentUserId: string, studentId: string): Promise<boolean> {
    return isParentLinkedToStudent(parentUserId, studentId);
  }
}
