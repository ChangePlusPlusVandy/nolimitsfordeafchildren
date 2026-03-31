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

export async function loadCurrentUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.path === "/health") {
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
