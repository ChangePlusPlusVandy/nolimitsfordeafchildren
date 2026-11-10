import { listStudents as serverListStudents } from "@/(dashboard)/(students)/_domain/queries";

import {
  linkStudentToParentUser as serverLinkStudentToParentUser,
  unlinkStudentFromParentUser as serverUnlinkStudentFromParentUser,
} from "./actions";

export async function getUserStudents(params?: { search?: string; page?: number; limit?: number }) {
  return serverListStudents(params as never);
}

export async function linkStudentToUser({
  userId,
  studentId,
  relationship,
  is_primary,
}: {
  userId: string;
  studentId: string;
  relationship?: string;
  is_primary?: boolean;
}) {
  return serverLinkStudentToParentUser(userId, studentId, { relationship, is_primary } as never);
}

export async function unlinkStudentFromUser({
  userId,
  studentId,
}: {
  userId: string;
  studentId: string;
}) {
  return serverUnlinkStudentFromParentUser(userId, studentId);
}
