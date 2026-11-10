import { staffByLocation } from "@/(dashboard)/(locations)/_domain/queries";
import type { AddSiblingInput, UpdateSiblingInput } from "@/(dashboard)/(students)/_domain/types";

import type {
  ChildDetails,
  LinkedChild,
  LocationStaffResponse,
  PaginatedResponse,
} from "../_domain/types";
import {
  addChildSibling,
  removeChildSibling,
  updateChildHearingInfo,
  updateChildSibling,
  type HearingInfoInput,
} from "./actions";
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

export type { HearingInfoInput } from "./actions";

export async function addChildSiblingToStudent(studentId: string, data: AddSiblingInput) {
  return addChildSibling(studentId, data);
}

export async function updateChildSiblingOfStudent(
  siblingId: string,
  studentId: string,
  data: UpdateSiblingInput,
) {
  return updateChildSibling(siblingId, studentId, data);
}

export async function removeChildSiblingFromStudent(siblingId: string, studentId: string) {
  return removeChildSibling(siblingId, studentId);
}

export async function updateChildHearingInfoForStudent(studentId: string, input: HearingInfoInput) {
  return updateChildHearingInfo(studentId, input);
}
