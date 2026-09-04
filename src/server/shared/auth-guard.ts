import type { UserEntity } from "@/db/schema";

export type AppRole = "administrator" | "teacher" | "parent" | "unassigned";

/**
 * Check whether a user has one of the given roles (ported from the Express
 * `roleMiddleware.ts` — used by services and, later, route handlers).
 */
export function hasRole(user: Pick<UserEntity, "role"> | undefined, ...roles: AppRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role as AppRole);
}

/** Require the current user to have one of the allowed roles. */
export function requireRole(...allowedRoles: AppRole[]) {
  return (user: Pick<UserEntity, "role"> | undefined): user is Pick<UserEntity, "role"> => {
    if (!user) {
      throw new Error("Unauthorized: No user found");
    }
    if (!allowedRoles.includes(user.role as AppRole)) {
      throw new Error(
        `Forbidden: Insufficient permissions (required: ${allowedRoles.join(", ")}; actual: ${user.role})`,
      );
    }
    return true;
  };
}

export const requireAdmin = requireRole("administrator");
export const requireTeacher = requireRole("teacher");
export const requireParent = requireRole("parent");
export const requireStaff = requireRole("administrator", "teacher");

export function isAdmin(user: Pick<UserEntity, "role"> | undefined): boolean {
  return hasRole(user, "administrator");
}
export function isTeacher(user: Pick<UserEntity, "role"> | undefined): boolean {
  return hasRole(user, "teacher");
}
export function isParent(user: Pick<UserEntity, "role"> | undefined): boolean {
  return hasRole(user, "parent");
}
