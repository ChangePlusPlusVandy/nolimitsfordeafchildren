import type { Request, Response, NextFunction } from "express";
import { auth, UnauthorizedError, InvalidTokenError } from "express-oauth2-jwt-bearer";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { UserTable, type UserEntity } from "@/db/schema";

// Extend Express Request to include user and auth error info
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserEntity;
      authError?: {
        code: "NO_TOKEN" | "INVALID_TOKEN" | "USER_NOT_FOUND" | "USER_DISABLED";
        message: string;
      };
    }
  }
}

/**
 * Auth0 JWT validation middleware (lazy-initialized)
 * Only created when auth is enabled to avoid errors when AUTH_DISABLED=true
 */
let jwtCheck: ReturnType<typeof auth> | null = null;

function getJwtCheck() {
  if (!jwtCheck) {
    jwtCheck = auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
      tokenSigningAlg: "RS256",
    });
  }
  return jwtCheck;
}

/**
 * Soft JWT validation - validates token if present, but doesn't reject requests without tokens.
 * This allows public routes to work while still populating req.auth for protected routes.
 * The actual authorization is handled by routing-controllers @Authorized() decorator.
 */
export function softJwtCheck(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // No token provided - continue without auth (public route access)
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.authError = {
      code: "NO_TOKEN",
      message: "No authorization token provided",
    };
    next();
    return;
  }

  // Token provided - validate it
  const jwtMiddleware = getJwtCheck();
  jwtMiddleware(req, res, (err?: any) => {
    if (err) {
      // Token was provided but is invalid - store error but continue
      // The @Authorized() decorator will reject if auth is required
      console.warn("JWT validation failed:", err.message);
      req.authError = {
        code: "INVALID_TOKEN",
        message: err.message || "Invalid or expired token",
      };
    }
    next();
  });
}

/**
 * Middleware to load the current user from the database.
 * Only attempts to load if JWT was successfully validated (req.auth exists).
 * Does NOT reject requests - stores errors for later use by authorization checker.
 */
export async function loadCurrentUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // If there was an auth error earlier, skip user loading
    if (req.authError) {
      next();
      return;
    }

    // The auth middleware from express-oauth2-jwt-bearer adds req.auth
    const authPayload = (req as any).auth?.payload;

    if (!authPayload?.sub) {
      // No valid auth payload - this shouldn't happen if softJwtCheck passed
      req.authError = {
        code: "NO_TOKEN",
        message: "No user identifier in token",
      };
      next();
      return;
    }

    const auth0Id = authPayload.sub as string;

    const users = await db.select().from(UserTable).where(eq(UserTable.auth0Id, auth0Id)).limit(1);

    if (users.length === 0) {
      req.authError = {
        code: "USER_NOT_FOUND",
        message: "User not found in database",
      };
      next();
      return;
    }

    const user = users[0]!;

    if (!user.is_active) {
      req.authError = {
        code: "USER_DISABLED",
        message: "User account is disabled",
      };
      next();
      return;
    }

    // Success - set current user
    req.currentUser = user;
    next();
  } catch (error) {
    console.error("Error loading current user:", error);
    req.authError = {
      code: "INVALID_TOKEN",
      message: "Error loading user data",
    };
    next();
  }
}

/**
 * Strict JWT validation - for routes that MUST have authentication.
 * Use this for endpoints that should fail without valid auth.
 */
export function strictJwtCheck(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "No authorization token provided",
      code: "NO_TOKEN",
    });
    return;
  }

  const jwtMiddleware = getJwtCheck();
  jwtMiddleware(req, res, (err?: any) => {
    if (err) {
      const statusCode =
        err instanceof UnauthorizedError || err instanceof InvalidTokenError ? 401 : 500;
      res.status(statusCode).json({
        error: "Unauthorized",
        message: err.message || "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
      return;
    }
    next();
  });
}

/**
 * Combined middleware: soft JWT check + load user
 * This is the global middleware that runs on ALL routes.
 * It validates tokens if present but doesn't reject unauthenticated requests.
 */
export function createGlobalAuthMiddleware(): Array<
  (req: Request, res: Response, next: NextFunction) => void
> {
  return [softJwtCheck, loadCurrentUser];
}

/**
 * Dev user IDs - must match the seed data in src/db/seed.ts
 */
const DEV_USER_IDS = {
  ADMIN: "5126c34f-4393-406c-8683-c9b696c02f38",
  TEACHER: "cd7c3cb2-a14c-4a94-b320-b64ec164df2e",
  PARENT: "823e1615-9ec0-483e-910e-6cd27296712d",
} as const;

/**
 * Dev users for testing different roles
 */
const DEV_USERS: Record<string, Partial<UserEntity>> = {
  administrator: {
    id: DEV_USER_IDS.ADMIN,
    auth0Id: "auth0|dev-admin",
    email: "admin.dev@gmail.com",
    name: "Dev Admin",
    phone: null,
    locale: "en-US",
    role: "administrator",
    is_active: true,
  },
  teacher: {
    id: DEV_USER_IDS.TEACHER,
    auth0Id: "auth0|dev-teacher",
    email: "teacher.dev@gmail.com",
    name: "Dev Teacher",
    phone: null,
    locale: "en-US",
    role: "teacher",
    is_active: true,
  },
  parent: {
    id: DEV_USER_IDS.PARENT,
    auth0Id: "auth0|dev-parent",
    email: "parent.dev@gmail.com",
    name: "Dev Parent",
    phone: null,
    locale: "en-US",
    role: "parent",
    is_active: true,
  },
};

/**
 * Development auth bypass middleware
 * Use when AUTH_DISABLED=true for local development
 * Supports role switching via X-Dev-Role header
 */
export function devAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Check for role override header: X-Dev-Role: administrator|teacher|parent
  const roleHeader = req.headers["x-dev-role"] as string | undefined;
  const role = roleHeader && DEV_USERS[roleHeader] ? roleHeader : "administrator";

  const devUser = DEV_USERS[role]!;

  // Set a mock user for development
  req.currentUser = {
    ...devUser,
    created_at: new Date(),
    updated_at: new Date(),
  } as UserEntity;

  // Clear any auth error since we have a user
  delete req.authError;

  next();
}

/**
 * Factory function to create global auth middleware
 * Automatically chooses between real auth and dev bypass
 */
export function createAuthMiddleware(): Array<
  (req: Request, res: Response, next: NextFunction) => void
> {
  const authDisabled = process.env.AUTH_DISABLED === "true";

  if (authDisabled) {
    console.warn("⚠️  Auth is DISABLED - using dev bypass middleware");
    return [devAuthMiddleware];
  }

  return createGlobalAuthMiddleware();
}
