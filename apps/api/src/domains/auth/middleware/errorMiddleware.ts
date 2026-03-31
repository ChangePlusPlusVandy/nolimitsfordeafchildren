import type { Request, Response, NextFunction } from "express";

/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, code: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Custom error class for authorization errors
 */
export class AuthorizationError extends Error {
  public statusCode: number;
  public code: string;
  public requiredRoles?: string[];

  constructor(message: string, code: string, requiredRoles?: string[]) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403;
    this.code = code;
    this.requiredRoles = requiredRoles;
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  requiredRoles?: string[];
  stack?: string;
}

/**
 * Global error handler middleware for Express.
 * Handles authentication/authorization errors from routing-controllers
 * and provides consistent JSON error responses.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  // Check if response already sent
  if (res.headersSent) {
    return;
  }

  // Check for custom headers set by authorizationChecker
  const authErrorCode = res.getHeader("X-Auth-Error-Code") as string | undefined;
  const authErrorMessage = res.getHeader("X-Auth-Error-Message") as string | undefined;

  // Remove custom headers (don't leak to client)
  res.removeHeader("X-Auth-Error-Code");
  res.removeHeader("X-Auth-Error-Message");

  // Determine error type and status code
  let statusCode = 500;
  let errorType = "Internal Server Error";
  let errorMessage = "An unexpected error occurred";
  let errorCode: string | undefined;
  let requiredRoles: string[] | undefined;

  // Handle routing-controllers auth errors - use our custom headers to determine actual status
  if (
    err.name === "AuthorizationRequiredError" ||
    err.name === "AccessDeniedError" ||
    err.httpCode === 401 ||
    err.httpCode === 403
  ) {
    // Determine correct status based on our error code
    if (authErrorCode) {
      switch (authErrorCode) {
        case "NO_TOKEN":
        case "INVALID_TOKEN":
        case "USER_NOT_FOUND":
          statusCode = 401;
          errorType = "Unauthorized";
          break;
        case "USER_DISABLED":
        case "USER_UNASSIGNED":
        case "INSUFFICIENT_ROLE":
          statusCode = 403;
          errorType = "Forbidden";
          break;
        default:
          statusCode = 401;
          errorType = "Unauthorized";
      }
      errorMessage = authErrorMessage || err.message;
      errorCode = authErrorCode;
    } else {
      // No custom headers - use routing-controllers default behavior
      statusCode = err.httpCode || 403;
      errorType = statusCode === 401 ? "Unauthorized" : "Forbidden";
      errorMessage = err.message || "Access denied";
      errorCode = statusCode === 401 ? "AUTH_REQUIRED" : "ACCESS_DENIED";
    }

    // Extract required roles if present
    if (authErrorMessage?.includes("Required roles:")) {
      requiredRoles = authErrorMessage.replace("Required roles: ", "").split(", ");
    }
  }
  // Handle our custom authentication errors
  else if (err instanceof AuthenticationError) {
    statusCode = err.statusCode;
    errorType = "Unauthorized";
    errorMessage = err.message;
    errorCode = err.code;
  }
  // Handle our custom authorization errors
  else if (err instanceof AuthorizationError) {
    statusCode = err.statusCode;
    errorType = "Forbidden";
    errorMessage = err.message;
    errorCode = err.code;
    requiredRoles = err.requiredRoles;
  }
  // Handle generic HTTP errors with httpCode
  else if (err.httpCode) {
    statusCode = err.httpCode;
    errorType = err.name || "Error";
    errorMessage = err.message || "An error occurred";
  }
  // Handle standard Error objects
  else if (err instanceof Error) {
    errorMessage = err.message;

    // Check for common error patterns
    if (err.message.includes("not found") || err.message.includes("Not found")) {
      statusCode = 404;
      errorType = "Not Found";
    } else if (err.message.includes("validation") || err.message.includes("invalid")) {
      statusCode = 400;
      errorType = "Bad Request";
    }
  }

  // Build response object
  const response: ErrorResponse = {
    error: errorType,
    message: errorMessage,
  };

  if (errorCode) {
    response.code = errorCode;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    response.requiredRoles = requiredRoles;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.stack = err.stack;
  }

  // Log error for debugging (but not for expected auth errors in production)
  if (statusCode >= 500) {
    console.error("Server error:", err);
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(`${errorType} (${statusCode}):`, errorMessage);
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    code: "ROUTE_NOT_FOUND",
  });
}
