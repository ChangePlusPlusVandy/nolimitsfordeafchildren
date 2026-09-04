import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";
import { StudentsService } from "@/server/students/service";
import { type ListUsersQuery, UsersService } from "@/server/users/service";

/**
 * GET /v1/users — list users (admin only).
 */
export async function listUsers(query: ListUsersQuery = {}) {
  await requireRole("administrator");
  return await new UsersService().index(query);
}

/**
 * GET /v1/users/:id — user with linked students (admin only).
 */
export async function getUser(id: string) {
  await requireRole("administrator");
  const user = await new UsersService().showWithLinkedStudents(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}

// NOTE: the dead legacy `ShowUserEndpoint` and `UserService` were dropped
// during the port (see migration inventory §5); this is the only show path.

/**
 * Student directory used by admin user-management screens. No user id is
 * involved — `search`/pagination only (src/client/users.ts imports this
 * name with `{ search, page, limit }` params).
 */
export async function getUserStudents(
  query: { search?: string; page?: number; limit?: number } = {},
) {
  await requireRole("administrator");
  return await new StudentsService().index(query, "administrator", undefined);
}
