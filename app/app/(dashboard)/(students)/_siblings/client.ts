import type { AddSiblingInput, UpdateSiblingInput } from "../_domain/types";
import {
  addSibling as serverAddSibling,
  removeSibling as serverRemoveSibling,
  updateSibling as serverUpdateSibling,
} from "./actions";

export async function addSiblingToStudent({
  studentId,
  ...data
}: AddSiblingInput & { studentId: string }) {
  return serverAddSibling(studentId, data);
}

export async function updateSiblingOfStudent(payload: UpdateSiblingInput & { id: string }) {
  const { id, ...data } = payload;
  return serverUpdateSibling(id, data);
}

export async function removeSiblingFromStudent(siblingId: string) {
  return serverRemoveSibling(siblingId);
}
