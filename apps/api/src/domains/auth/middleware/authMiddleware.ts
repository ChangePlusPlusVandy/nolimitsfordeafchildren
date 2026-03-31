import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { auth, ensureAppUser } from "@/auth";
import { db } from "@/db";
import { AuthUserTable, UserTable, type UserEntity } from "@/db/schema";

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserEntity;
      authError?: {
        code:
          | "NO_TOKEN"
          | "INVALID_TOKEN"
          | "USER_NOT_FOUND"
          | "USER_DISABLED"
          | "USER_UNASSIGNED";
        message: string;
      };
    }
  }
}

const DEV_ROLE_HEADER = "x-dev-role";

const DEV_USERS: Record<"administrator" | "teacher" | "parent" | "unassigned", Partial<UserEntity>> =
  {
    administrator: {
      id: "5126c34f-4393-406c-8683-c9b696c02f38",
      authUserId: "dev-admin",
      email: "admin.dev@gmail.com",
      name: "Dev Admin",
      phone: null,
      locale: "en-US",
      role: "administrator",
      is_active: true,
    },
    teacher: {
      id: "cd7c3cb2-a14c-4a94-b320-b64ec164df2e",
      authUserId: "dev-teacher",
      email: "teacher.dev@gmail.com",
      name: "Dev Teacher",
      phone: null,
      locale: "en-US",
      role: "teacher",
      is_active: true,
    },
    parent: {
      id: "823e1615-9ec0-483e-910e-6cd27296712d",
      authUserId: "dev-parent",
      email: "parent.dev@gmail.com",
      name: "Dev Parent",
      phone: null,
      locale: "en-US",
      role: "parent",
      is_active: true,
    },
    unassigned: {
      id: "d1111111-1111-4111-8111-111111111111",
      authUserId: "dev-unassigned",
      email: "pending.dev@gmail.com",
      name: "Pending User",
      phone: null,
      locale: "en-US",
      role: "unassigned",
      is_active: true,
    },
  };

export async function loadCurrentUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authDisabled = process.env.AUTH_DISABLED === "true";

  if (req.path === "/health") {
    next();
    return;
  }

  if (authDisabled) {
    const headerRole = (req.headers[DEV_ROLE_HEADER] as string | undefined) || "administrator";
    const role =
      headerRole === "administrator" ||
      headerRole === "teacher" ||
      headerRole === "parent" ||
      headerRole === "unassigned"
        ? headerRole
        : "administrator";

    const devUser = DEV_USERS[role];
    req.currentUser = {
      ...devUser,
      created_at: new Date(),
      updated_at: new Date(),
    } as UserEntity;
    delete req.authError;
    next();
    return;
  }

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.id) {
      req.authError = {
        code: "NO_TOKEN",
        message: "No active session",
      };
      next();
      return;
    }

    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.authUserId, session.user.id))
      .limit(1);

    const user = users[0];

    if (!user) {
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
          req.currentUser = ensured;
          delete req.authError;
          next();
          return;
        }
      }

      req.authError = {
        code: "USER_NOT_FOUND",
        message: "User not found in application database",
      };
      next();
      return;
    }

    if (!user.is_active) {
      req.authError = {
        code: "USER_DISABLED",
        message: "User account is disabled",
      };
      next();
      return;
    }

    req.currentUser = user;
    delete req.authError;
    next();
  } catch (error) {
    req.authError = {
      code: "INVALID_TOKEN",
      message: error instanceof Error ? error.message : "Invalid session",
    };
    next();
  }
}

export function createAuthMiddleware(): Array<
  (req: Request, res: Response, next: NextFunction) => void | Promise<void>
> {
  return [loadCurrentUser];
}
