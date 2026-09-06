import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ParentProfileTable,
  ParentStudentLinkTable,
  TeacherProfileTable,
  TeacherStudentTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { type AppRole, requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/server/shared/errors";
import { errorResponse, filenameFromKey } from "../_shared";

/**
 * GET /api/files/[...key]
 *
 * Auth-checked R2 object download, replacing presigned download URLs and
 * public r2.dev URLs (PII safety). The catch-all segment is required because
 * object keys contain slashes (e.g. `documents/student/<id>/audiogram/x.pdf`).
 *
 * Access control is enforced per object, mirroring the domain visibility
 * rules (AGENTS.md PII rules: parents see only their linked children,
 * teachers see only assigned students):
 * - `documents/student/<studentId>/…`   -> admin, or teacher/parent with an
 *                                          ACTIVE link to that student
 * - `documents/teacher/<teacherId>/…`   -> admin, or that teacher themself
 * - `photos/…` and `bulletins/…`        -> any authenticated (non-unassigned) user
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const currentUser = await requireRole();

    const key = (await params).key.join("/");
    if (!key || key.includes("..") || key.startsWith("/")) {
      throw new BadRequestError("Invalid file key");
    }

    await authorizeKey(currentUser.id, currentUser.role, key);

    const bucket = getCloudflareContext().env.BUCKET;
    if (!bucket) {
      throw new Error("[files] BUCKET binding not configured (see wrangler.jsonc)");
    }

    const object = await bucket.get(key);
    if (!object) {
      throw new NotFoundError("File not found");
    }

    // Buffer the object: the OpenNext DEV proxy cannot serialize a raw
    // ReadableStream body ("Cannot stringify arbitrary non-POJOs"), while an
    // ArrayBuffer body works identically in `next dev` and in the deployed
    // Workers runtime. Object sizes are bounded by the upload route's 25 MiB
    // cap, so buffering is negligible at this scale.
    // NOTE: do not touch `object.body` before this — the dev emulation's
    // body getter consumes the stream (one-shot), which breaks arrayBuffer().
    const body = await object.arrayBuffer();

    const responseHeaders = new Headers();
    try {
      object.writeHttpMetadata(responseHeaders);
    } catch {
      // OpenNext dev proxy cannot serialize a Headers instance across the RPC boundary
      // ("Cannot stringify arbitrary non-POJOs"). Fall back to reading httpMetadata directly.
      if (object.httpMetadata?.contentType) {
        responseHeaders.set("Content-Type", object.httpMetadata.contentType);
      }
    }
    responseHeaders.set("Content-Length", String(object.size));
    responseHeaders.set("Content-Disposition", `inline; filename="${filenameFromKey(key)}"`);
    responseHeaders.set("Cache-Control", "private, no-store");

    return new NextResponse(body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Authorize a request to a specific object key. Throws ForbiddenError when
 * the user has no right to the object, NotFoundError for unknown key shapes.
 */
async function authorizeKey(userId: string, role: AppRole, key: string): Promise<void> {
  const segments = key.split("/");
  const purpose = segments[0];

  if (purpose === "photos" || purpose === "bulletins") {
    // Non-PII app content: any authenticated (non-unassigned) user may view.
    return;
  }

  if (purpose !== "documents") {
    throw new NotFoundError("File not found");
  }

  const [, entityType, entityId] = segments;
  if (!entityType || !entityId) {
    throw new NotFoundError("File not found");
  }

  if (entityType === "student") {
    if (role === "administrator") return;

    if (role === "teacher") {
      const teacherProfile = await db
        .select({ id: TeacherProfileTable.id })
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, userId))
        .limit(1);
      if (!teacherProfile[0]) throw new ForbiddenError("You cannot access this file");
      const link = await db
        .select({ id: TeacherStudentTable.id })
        .from(TeacherStudentTable)
        .where(
          and(
            eq(TeacherStudentTable.student_id, entityId),
            eq(TeacherStudentTable.teacher_id, teacherProfile[0].id),
            isNull(TeacherStudentTable.unassigned_at),
          ),
        )
        .limit(1);
      if (link[0]) return;
      throw new ForbiddenError("You cannot access this student's files");
    }

    if (role === "parent") {
      const parentProfile = await db
        .select({ id: ParentProfileTable.id })
        .from(ParentProfileTable)
        .where(eq(ParentProfileTable.user_id, userId))
        .limit(1);
      if (!parentProfile[0]) throw new ForbiddenError("You cannot access this file");
      const link = await db
        .select({ id: ParentStudentLinkTable.id })
        .from(ParentStudentLinkTable)
        .where(
          and(
            eq(ParentStudentLinkTable.student_id, entityId),
            eq(ParentStudentLinkTable.parent_id, parentProfile[0].id),
            isNull(ParentStudentLinkTable.revoked_at),
          ),
        )
        .limit(1);
      if (link[0]) return;
      throw new ForbiddenError("You cannot access this student's files");
    }

    throw new ForbiddenError("You cannot access this file");
  }

  if (entityType === "teacher") {
    if (role === "administrator") return;
    if (role === "teacher") {
      const teacherProfile = await db
        .select({ id: TeacherProfileTable.id })
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.user_id, userId))
        .limit(1);
      // Teachers can download their own files (e.g. their CV).
      if (teacherProfile[0] && teacherProfile[0].id === entityId) return;
    }
    throw new ForbiddenError("You cannot access this file");
  }

  // Sanity: entity id should belong to a real record to avoid guessing.
  throw new NotFoundError("File not found");
}
