/**
 * Thin client data-access layer for Users (admin user management).
 *
 * Names reconcile 1:1 with `src/server/users/{queries,actions}.ts`.
 */

import { listStudents as serverListStudents } from "@/server/students/queries";
import {
  disableUser as serverDisableUser,
  enableUser as serverEnableUser,
  inviteUser as serverInviteUser,
  linkStudentToParentUser as serverLinkStudentToParentUser,
  unlinkStudentFromParentUser as serverUnlinkStudentFromParentUser,
  updateUser as serverUpdateUser,
} from "@/server/users/actions";
import { getUser as serverGetUser, listUsers as serverListUsers } from "@/server/users/queries";

export type { InviteUserInput, ListUsersQuery, UpdateUserInput } from "@/server/users/service";

export type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

export interface User {
  id: string;
  authUserId: string | null;
  email: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  locale: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  linked_students?: Array<{
    link_id: string;
    student_id: string;
    initials: string;
    first_name: string;
    last_name: string;
    relationship: string | null;
    is_primary: boolean;
    linked_at: string;
  }>;
}

export interface ListUsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listUsers(
  params?: import("@/server/users/service").ListUsersQuery,
): Promise<ListUsersResponse> {
  return serverListUsers(params as never) as never;
}

export async function getUserDetails(id: string): Promise<User> {
  return serverGetUser(id) as never as never;
}

/** Student picker for linking parents to students (admin). */
export async function getUserStudents(params?: { search?: string; page?: number; limit?: number }) {
  return serverListStudents(params as never);
}

export async function inviteUser(payload: import("@/server/users/service").InviteUserInput) {
  return serverInviteUser(payload);
}

export async function updateUser(
  payload: import("@/server/users/service").UpdateUserInput & { id: string },
) {
  const { id, ...data } = payload;
  return serverUpdateUser(id, data);
}

export async function disableUser(id: string): Promise<{ success: boolean; message: string }> {
  return serverDisableUser(id) as never;
}

export async function enableUser(id: string): Promise<User> {
  return serverEnableUser(id) as never;
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
  return serverLinkStudentToParentUser(userId, studentId, {
    relationship,
    is_primary,
  } as never);
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
