import { childDetail, myChildren } from "@/server/parents/children";
import { directory, zipReport } from "@/server/parents/directory";
import { getMissedSessions } from "@/server/parents/missed-sessions";
import { isParentLinkedToStudent } from "@/server/parents/parent-access";
import type {
  ChildDetails,
  DirectoryPerson,
  LinkedChild,
  PaginatedQuery,
  PaginatedResponse,
  ParentZipReportGroup,
} from "@/server/parents/types";

export type {
  AudiogramCompliance,
  AudiogramComplianceStatus,
  ChildDetails,
  ChildScheduleSession,
  DirectoryPerson,
  LinkedChild,
  ParentZipReportGroup,
  ParentZipReportItem,
} from "@/server/parents/types";

/**
 * Facade for parent-domain reads. Implementation is split across
 * `directory.ts`, `children.ts`, `schedule-sessions.ts`, and
 * `missed-sessions.ts`.
 */
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
