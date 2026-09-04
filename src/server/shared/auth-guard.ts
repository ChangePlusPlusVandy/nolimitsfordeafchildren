import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { AuthUserTable, type UserEntity, UserTable } from "@/db/schema";
import { ensureAppUser, getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ForbiddenError, HttpError, UnauthorizedError } from "@/server/shared/errors";

export type AppRole = "administrator" | "teacher" | "parent" | "unassigned";

/**
 * Auth failure codes, mirroring the Express `authMiddleware.ts` / index.ts
 * `authorizationChecker` semantics (X-Auth-Error-Code on 401/403 responses).
 * Server Actions cannot set response headers, so the code + message ride on
 * the thrown HttpError itself (code -> HttpError.code, HTTP status -> 401/403).
 */
export type AuthErrorCode =
  | "NO_TOKEN"
  | "INVALID_TOKEN"
  | "USER_NOT_FOUND"
  | "USER_DISABLED"
  | "USER_UNASSIGNED"
  | "INSUFFICIENT_ROLE";

export type CurrentUserResult =
  | { status: "ok"; user: UserEntity }
  | { status: "error"; code: AuthErrorCode; message: string };

/**
 * Load the current user from the better-auth session (via the request
 * headers) and map it to the app `users` row — the port of the Express
 * `loadCurrentUser` middleware.
 *
 * - No session             -> NO_TOKEN
 * - Session invalid        -> INVALID_TOKEN
 * - App user row missing   -> created via `ensureAppUser` (databaseHooks
 *                             equivalent); USER_NOT_FOUND if creation fails
 * - Disabled app user      -> USER_DISABLED
 * - Unassigned users are returned as `ok` (the unassigned gate is enforced
 *   by `requireRole`, with the /auth/me + /me exemptions preserved).
 */
type AuthSession = Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>;

export async function resolveCurrentUser(): Promise<CurrentUserResult> {
  let session: AuthSession | null = null;
  try {
    session = await getAuth().api.getSession({ headers: await headers() });
  } catch (error) {
    return {
      status: "error",
      code: "INVALID_TOKEN",
      message: error instanceof Error ? error.message : "Invalid session",
    };
  }

  if (!session?.user?.id) {
    return { status: "error", code: "NO_TOKEN", message: "No active session" };
  }

  const users = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.authUserId, session.user.id))
    .limit(1);

  const user = users[0];

  if (user) {
    if (!user.is_active) {
      return { status: "error", code: "USER_DISABLED", message: "User account is disabled" };
    }
    return { status: "ok", user };
  }

  // Auth user exists but no app row yet — create one (same fallback the
  // Express middleware did via ensureAppUser).
  const authUsers = await db
    .select()
    .from(AuthUserTable)
    .where(eq(AuthUserTable.id, session.user.id))
    .limit(1);

  const authUser = authUsers[0];
  if (authUser) {
    const ensured = await ensureAppUser({
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
    });
    if (ensured) {
      return { status: "ok", user: ensured };
    }
  }

  return {
    status: "error",
    code: "USER_NOT_FOUND",
    message: "User not found in application database",
  };
}

/**
 * Current user or `null` (no throw). Unassigned users ARE returned here —
 * this backs the two endpoints exempt from the unassigned gate
 * (GET /auth/me, GET /me) and is the "public route" convenience accessor
 * (public routes in the Express app had `req.currentUser` possibly undefined).
 */
export async function getCurrentUser(): Promise<UserEntity | null> {
  const result = await resolveCurrentUser();
  return result.status === "ok" ? result.user : null;
}

/**
 * Require an authenticated app user with one of the given roles.
 *
 * Port of the Express `authorizationChecker` (index.ts:404-479):
 * - No/invalid token or unknown user -> 401
 * - Disabled account                 -> 403 (USER_DISABLED)
 * - Unassigned account               -> 403 (USER_UNASSIGNED) for every
 *   protected function (the /auth/me + /me exemptions live in those
 *   queries via `getCurrentUser` instead)
 * - Wrong role                       -> 403 (INSUFFICIENT_ROLE)
 *
 * Call with NO roles for "any authenticated user" (@Authorized()).
 * Returns the current user on success.
 */
export async function requireRole(...allowedRoles: AppRole[]): Promise<UserEntity> {
  const result = await resolveCurrentUser();
  if (result.status === "error") {
    if (result.code === "USER_DISABLED") {
      throw new ForbiddenError(result.message);
    }
    throw new UnauthorizedError(result.message);
  }

  const { user } = result;

  if (user.role === "unassigned") {
    throw new ForbiddenError(
      "Account pending administrator approval before accessing the application",
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new HttpError(403, "INSUFFICIENT_ROLE", `Required roles: ${allowedRoles.join(", ")}`);
  }

  return user;
}

/** Sync role helpers (role checks on an already-loaded user). */
export function hasRole(user: Pick<UserEntity, "role"> | undefined, ...roles: AppRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role as AppRole);
}

export function isAdmin(user: Pick<UserEntity, "role"> | undefined): boolean {
  return hasRole(user, "administrator");
}
export function isTeacher(user: Pick<UserEntity, "role"> | undefined): boolean {
  return hasRole(user, "teacher");
}
export function isParent(user: Pick<UserEntity, "role"> | undefined): boolean {
  return hasRole(user, "parent");
}
