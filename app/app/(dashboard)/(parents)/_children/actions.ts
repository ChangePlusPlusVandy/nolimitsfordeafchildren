"use server";

import type { AddSiblingInput, UpdateSiblingInput } from "@/(dashboard)/(students)/_domain/types";
import { UpdateStudentService } from "@/(dashboard)/(students)/_edit/service";
import * as siblings from "@/(dashboard)/(students)/_siblings/service";
import { requireRole } from "@/_platform/auth/guard";
import { ForbiddenError, NotFoundError } from "@/_shared/server/errors";

import { isParentLinkedToStudent } from "../_access/service";
import {
  parentHearingInfoSchema,
  parentSiblingAddSchema,
  parentSiblingUpdateSchema,
  type HearingInfoInput,
} from "./validation";

export type { HearingInfoInput };

async function assertParentOwnsChild(parentUserId: string, studentId: string): Promise<void> {
  const linked = await isParentLinkedToStudent(parentUserId, studentId);
  if (!linked) {
    throw new ForbiddenError("You can only manage data for your linked children");
  }
}

export async function addChildSibling(studentId: string, input: AddSiblingInput) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);
  const parsed = parentSiblingAddSchema.parse(input) as AddSiblingInput;
  return await siblings.addSibling(studentId, parsed);
}

export async function updateChildSibling(
  siblingId: string,
  studentId: string,
  input: UpdateSiblingInput,
) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);

  // Verify the target sibling actually belongs to the authorized student so a
  // parent cannot pass their own child's ID alongside another family's siblingId.
  const existing = await siblings.getSiblingById(siblingId);
  if (!existing || existing.student_id !== studentId) {
    throw new ForbiddenError("Sibling does not belong to your linked child");
  }

  const parsed = parentSiblingUpdateSchema.parse(input) as UpdateSiblingInput;
  const sibling = await siblings.updateSibling(siblingId, parsed);
  if (!sibling) {
    throw new NotFoundError("Sibling not found");
  }
  return sibling;
}

export async function removeChildSibling(siblingId: string, studentId: string) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);

  // Same cross-family guard as updateChildSibling.
  const existing = await siblings.getSiblingById(siblingId);
  if (!existing || existing.student_id !== studentId) {
    throw new ForbiddenError("Sibling does not belong to your linked child");
  }

  return await siblings.removeSibling(siblingId);
}

export async function updateChildHearingInfo(studentId: string, input: HearingInfoInput) {
  const user = await requireRole("parent");
  await assertParentOwnsChild(user.id, studentId);
  const parsed = parentHearingInfoSchema.parse(input);
  const student = await new UpdateStudentService().update(studentId, parsed);
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}
