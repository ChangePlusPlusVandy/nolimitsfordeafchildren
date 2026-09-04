import { NextResponse } from "next/server";
import { isHttpError } from "@/server/shared/errors";

/**
 * Shared helpers for the /api/files/* route handlers (private file — the
 * leading underscore keeps it out of the route table).
 */

/** Map a thrown error to a JSON response, preserving auth-error semantics. */
export function errorResponse(error: unknown): NextResponse {
  if (isHttpError(error)) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      {
        status: error.status,
        headers: {
          // Mirrors the Express authorizationChecker's X-Auth-Error-* headers.
          "X-Auth-Error-Code": error.code,
          "X-Auth-Error-Message": error.message,
        },
      },
    );
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Validate an uploaded object key from the URL against a purpose prefix. */
export function validateKey(key: string, purpose: string): boolean {
  if (!key || key.length > 1024) return false;
  if (key.includes("..") || key.startsWith("/")) return false;
  return key.startsWith(`${purpose}/`);
}

/** Safest available filename from a key (for Content-Disposition). */
export function filenameFromKey(key: string): string {
  const segments = key.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "file";
  // Strip anything that could break the header, keep one extension.
  return last.replace(/["\r\n]/g, "").replace(/[^\w.+-]+/g, "_");
}
