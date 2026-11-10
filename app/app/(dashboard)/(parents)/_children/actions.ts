"use server";

import type { AddSiblingInput, UpdateSiblingInput } from "@/(dashboard)/(students)/_domain/types";
import { requireRole } from "@/_platform/auth/guard";

import * as mutations from "./mutations";
import {
  parentHearingInfoSchema,
  parentSiblingAddSchema,
  parentSiblingUpdateSchema,
  type HearingInfoInput,
} from "./validation";

export type { HearingInfoInput };

export async function addChildSibling(studentId: string, input: AddSiblingInput) {
  const user = await requireRole("parent");
  const parsed = parentSiblingAddSchema.parse(input) as AddSiblingInput;
  return await mutations.addChildSibling(user.id, studentId, parsed);
}

export async function updateChildSibling(
  siblingId: string,
  studentId: string,
  input: UpdateSiblingInput,
) {
  const user = await requireRole("parent");
  const parsed = parentSiblingUpdateSchema.parse(input) as UpdateSiblingInput;
  return await mutations.updateChildSibling(user.id, studentId, siblingId, parsed);
}

export async function removeChildSibling(siblingId: string, studentId: string) {
  const user = await requireRole("parent");
  return await mutations.removeChildSibling(user.id, studentId, siblingId);
}

export async function updateChildHearingInfo(studentId: string, input: HearingInfoInput) {
  const user = await requireRole("parent");
  const parsed = parentHearingInfoSchema.parse(input);
  return await mutations.updateChildHearingInfo(user.id, studentId, parsed);
}
