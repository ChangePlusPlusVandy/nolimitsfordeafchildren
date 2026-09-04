import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";
import { errorResponse, filenameFromKey } from "../_shared";

/**
 * GET /api/files/[...key]
 *
 * Auth-checked R2 object download, replacing presigned download URLs and
 * public r2.dev URLs (PII safety). The catch-all segment is required because
 * object keys contain slashes (e.g. `documents/student/<id>/audiogram/x.pdf`).
 *
 * Any authenticated (non-unassigned) user may fetch an object by key — the
 * same access model as the old `GET /v1/documents/:id/download` (the URL is
 * only ever handed out by service functions that enforce per-entity rules).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    await requireRole();

    const key = (await params).key.join("/");
    if (!key || key.includes("..") || key.startsWith("/")) {
      throw new BadRequestError("Invalid file key");
    }

    const bucket = getCloudflareContext().env.BUCKET;
    if (!bucket) {
      throw new Error("[files] BUCKET binding not configured (see wrangler.jsonc)");
    }

    const object = await bucket.get(key);
    if (!object) {
      throw new NotFoundError("File not found");
    }

    if (!object.body) {
      throw new NotFoundError("File not found");
    }

    const responseHeaders = new Headers();
    object.writeHttpMetadata(responseHeaders);
    responseHeaders.set("Content-Length", String(object.size));
    responseHeaders.set("Content-Disposition", `inline; filename="${filenameFromKey(key)}"`);
    responseHeaders.set("Cache-Control", "private, no-store");

    return new NextResponse(object.body as Readonly<ReadableStream<Uint8Array>>, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
