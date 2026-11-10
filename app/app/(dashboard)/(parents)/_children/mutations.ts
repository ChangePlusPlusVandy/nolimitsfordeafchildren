import type { AddSiblingInput, UpdateSiblingInput } from "@/(dashboard)/(students)/_domain/types";
import { UpdateStudentService } from "@/(dashboard)/(students)/_edit/service";
import * as siblings from "@/(dashboard)/(students)/_siblings/service";
import { ForbiddenError, NotFoundError } from "@/_shared/server/errors";

import { isParentLinkedToStudent } from "../_access/service";
import type { HearingInfoInput } from "./validation";

async function assertParentOwnsChild(parentUserId: string, studentId: string): Promise<void> {
  if (!(await isParentLinkedToStudent(parentUserId, studentId))) {
    throw new ForbiddenError("You can only manage data for your linked children");
  }
}

async function assertParentOwnsSibling(parentUserId: string, studentId: string, siblingId: string) {
  await assertParentOwnsChild(parentUserId, studentId);
  const existing = await siblings.getSiblingById(siblingId);
  // Authorizing the child alone must not authorize another family's sibling ID.
  if (!existing || existing.student_id !== studentId) {
    throw new ForbiddenError("Sibling does not belong to your linked child");
  }
}

export async function addChildSibling(
  parentUserId: string,
  studentId: string,
  input: AddSiblingInput,
) {
  await assertParentOwnsChild(parentUserId, studentId);
  return await siblings.addSibling(studentId, input);
}

export async function updateChildSibling(
  parentUserId: string,
  studentId: string,
  siblingId: string,
  input: UpdateSiblingInput,
) {
  await assertParentOwnsSibling(parentUserId, studentId, siblingId);
  const sibling = await siblings.updateSibling(siblingId, input);
  if (!sibling) {
    throw new NotFoundError("Sibling not found");
  }
  return sibling;
}

export async function removeChildSibling(
  parentUserId: string,
  studentId: string,
  siblingId: string,
) {
  await assertParentOwnsSibling(parentUserId, studentId, siblingId);
  return await siblings.removeSibling(siblingId);
}

export async function updateChildHearingInfo(
  parentUserId: string,
  studentId: string,
  input: HearingInfoInput,
) {
  await assertParentOwnsChild(parentUserId, studentId);
  const student = await new UpdateStudentService().update(studentId, input);
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}
