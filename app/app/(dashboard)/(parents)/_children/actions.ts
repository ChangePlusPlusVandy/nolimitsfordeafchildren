"use server";

import { UpdateStudentService } from "@/(dashboard)/(students)/_edit/service";
import { updateStudentSchema } from "@/(dashboard)/(students)/_edit/validation";
import type { AddSiblingInput, UpdateSiblingInput } from "@/(dashboard)/(students)/_domain/types";
import * as siblings from "@/(dashboard)/(students)/_siblings/service";
import { siblingSchema } from "@/(dashboard)/(students)/_siblings/validation";
import { requireRole } from "@/_platform/auth/guard";
import { ForbiddenError, NotFoundError } from "@/_shared/server/errors";

import { isParentLinkedToStudent } from "../_access/service";

async function assertParentOwnsChild(parentUserId: string, studentId: string): Promise<void> {
  const linked = await isParentLinkedToStudent(parentUserId, studentId);
  if (!linked) {
    throw new ForbiddenError("You can only manage data for your linked children");
  }
}

export async function addChildSibling(studentId: string, input: AddSiblingInput) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);
  const parsed = siblingSchema.parse(input) as AddSiblingInput;
  return await siblings.addSibling(studentId, parsed);
}

export async function updateChildSibling(
  siblingId: string,
  studentId: string,
  input: UpdateSiblingInput,
) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);
  const parsed = siblingSchema.partial().parse(input) as UpdateSiblingInput;
  const sibling = await siblings.updateSibling(siblingId, parsed);
  if (!sibling) {
    throw new NotFoundError("Sibling not found");
  }
  return sibling;
}

export async function removeChildSibling(siblingId: string, studentId: string) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);
  return await siblings.removeSibling(siblingId);
}

const hearingInfoSchema = updateStudentSchema.pick({
  hearing_devices: true,
  hearing_loss_type: true,
});

export type HearingInfoInput = {
  hearing_devices: string[];
  hearing_loss_type:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
};

export async function updateChildHearingInfo(studentId: string, input: HearingInfoInput) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);
  const parsed = hearingInfoSchema.parse(input);
  const student = await new UpdateStudentService().update(studentId, parsed);
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}
