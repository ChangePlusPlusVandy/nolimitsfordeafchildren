import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireRole } from "@/_platform/auth/guard";
import { getBinding } from "@/_platform/env";
import { NotFoundError } from "@/_shared/server/errors";

import { authorizeDownload } from "../_services/file-access";
import { errorResponse, filenameFromKey } from "../_shared";

/**
 * GET /api/files/[...key]
 *
 * Auth-checked R2 object download. Access control:
 * - `documents/student/<studentId>/…` -> admin, or teacher/parent with an active link
 *                                        (parents: approved documents only)
 * - `documents/teacher/<teacherId>/…` -> admin, or that teacher themself
 * - `photos/…`                        -> users the photo gallery would show that photo to
 * - `bulletins/…`                     -> users the bulletin board shows that bulletin to
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const currentUser = await requireRole();

    const key = (await params).key.join("/");
    await authorizeDownload(currentUser, key);

    const bucket = getBinding<R2Bucket>("BUCKET");
    if (!bucket) {
      throw new Error("[files] BUCKET binding not configured (see wrangler.jsonc)");
    }

    const object = await bucket.get(key);
    if (!object) {
      throw new NotFoundError("File not found");
    }

    const body = await object.arrayBuffer();

    const responseHeaders = new Headers();
    try {
      object.writeHttpMetadata(responseHeaders);
    } catch {
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
