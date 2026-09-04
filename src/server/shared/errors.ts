/**
 * Framework-neutral HTTP errors for ported services.
 *
 * The old Express app threw `ForbiddenError`/`NotFoundError` from
 * `routing-controllers`. Route-handler porting (later task) will catch these
 * and map them to Next.js `NextResponse` status codes.
 */

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = "Not found") {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = "Forbidden") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = "Bad request") {
    super(400, "BAD_REQUEST", message);
    this.name = "BadRequestError";
  }
}

/** Map a thrown error to an HTTP status (used by route handlers later). */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
