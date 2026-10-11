import { getByEmail, getUser, getUserWithStudents } from "../_detail/service";
import { updateUser } from "../_edit/service";
import { inviteUser } from "../_invite/service";
import { linkStudent, unlinkStudent } from "../_links/service";
import { listUsers } from "../_list/service";
import { disableUser, enableUser } from "../_status/service";
import type { InviteUserInput, ListUsersQuery, UpdateUserInput } from "./types";

export { updateUser } from "../_edit/actions";
export { inviteUser } from "../_invite/actions";
export {
  linkStudent,
  linkStudentToParentUser,
  unlinkStudent,
  unlinkStudentFromParentUser,
} from "../_links/actions";
export { disableUser, enableUser } from "../_status/actions";
export type {
  InviteUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserWithLinkedStudents,
} from "./types";

export class UsersService {
  async index(query: ListUsersQuery) {
    return listUsers(query);
  }

  async show(id: string) {
    return getUser(id);
  }

  async showWithLinkedStudents(id: string) {
    return getUserWithStudents(id);
  }

  async getByEmail(email: string) {
    return getByEmail(email);
  }

  async invite(input: InviteUserInput) {
    return inviteUser(input);
  }

  async update(id: string, input: UpdateUserInput) {
    return updateUser(id, input);
  }

  async disable(id: string) {
    return disableUser(id);
  }

  async enable(id: string) {
    return enableUser(id);
  }

  async linkStudentToParentUser(
    parentUserId: string,
    studentId: string,
    relationship?: string,
    isPrimary?: boolean,
  ) {
    return linkStudent(parentUserId, studentId, relationship, isPrimary);
  }

  async unlinkStudentFromParentUser(parentUserId: string, studentId: string) {
    return unlinkStudent(parentUserId, studentId);
  }
}

export const usersService = new UsersService();
