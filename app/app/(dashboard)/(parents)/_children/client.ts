import { staffByLocation } from "@/(dashboard)/(locations)/_domain/queries";

import type {
  ChildDetails,
  LinkedChild,
  LocationStaffResponse,
  PaginatedResponse,
} from "../_domain/types";
import { childDetail, myChildren } from "./queries";

export type { ChildScheduleSession, LinkedChild, LocationStaffMember } from "../_domain/types";

export async function getMyChildren(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<LinkedChild>> {
  return myChildren(params);
}

export async function getChildDetails(studentId: string): Promise<ChildDetails> {
  return childDetail(studentId) as never;
}

export async function getLocationStaff(siteId: string): Promise<LocationStaffResponse> {
  return staffByLocation(siteId) as never;
}
