import type { LinkParentInput } from "../../_domain/types";
import {
  linkStudentParent as serverLinkStudentParent,
  unlinkStudentParent as serverUnlinkStudentParent,
} from "./actions";

export async function linkParentToStudent({
  studentId,
  ...data
}: LinkParentInput & { studentId: string }) {
  return serverLinkStudentParent(studentId, data);
}

export async function unlinkParentFromStudent({
  studentId,
  parentId,
}: {
  studentId: string;
  parentId: string;
}) {
  return serverUnlinkStudentParent(studentId, parentId);
}
