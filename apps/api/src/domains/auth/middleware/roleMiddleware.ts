import type { Request, Response, NextFunction } from "express";
import type { UserEntity } from "@/db/schema";

type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

/**
 * Middleware factory that requires the user to have one of the specified roles
 * Must be used after authMiddleware (which sets req.currentUser)
 *
 * @example
 * // Single role
 * router.get("/admin-only", requireRole("administrator"), handler);
 *
 * // Multiple roles
 * router.get("/staff", requireRole("administrator", "teacher"), handler);
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.currentUser as UserEntity | undefined;

    if (!user) {
      res.status(401).json({ error: "Unauthorized: No user found" });
      return;
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      res.status(403).json({
        error: "Forbidden: Insufficient permissions",
        required: allowedRoles,
        actual: user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Shorthand middleware for admin-only routes
 */
export const requireAdmin = requireRole("administrator");

/**
 * Shorthand middleware for teacher-only routes
 */
export const requireTeacher = requireRole("teacher");

/**
 * Shorthand middleware for parent-only routes
 */
export const requireParent = requireRole("parent");

/**
 * Middleware for routes accessible by admins and teachers
 */
export const requireStaff = requireRole("administrator", "teacher");

/**
 * Helper to check if current user has a specific role
 * Use this in controllers when you need conditional logic based on role
 */
export function hasRole(user: UserEntity | undefined, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role as UserRole);
}

/**
 * Helper to check if user is admin
 */
export function isAdmin(user: UserEntity | undefined): boolean {
  return hasRole(user, "administrator");
}

/**
 * Helper to check if user is teacher
 */
export function isTeacher(user: UserEntity | undefined): boolean {
  return hasRole(user, "teacher");
}

/**
 * Helper to check if user is parent
 */
export function isParent(user: UserEntity | undefined): boolean {
  return hasRole(user, "parent");
}
