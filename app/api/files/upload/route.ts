import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, PayloadTooLargeError } from "@/server/shared/errors";
import { errorResponse, purposeFromKey } from "../_shared";

/**
 * POST /api/files/upload?key=<key>[&purpose=documents|photos|bulletins]
 *
 * Authenticated direct-to-R2 upload, replacing the S3 presigned-upload-URL
 * flow (R2 has no S3 presigning). The client first calls the domain's
 * upload-url action (which validates entity/role rules and generates the
 * key), then POSTs the file here as multipart field `file`.
 *
 * The purpose is derived from the key prefix (`documents/…`, `photos/…`,
 * `bulletins/…`) — no separate param required. A `purpose` query param is
 * accepted for compatibility but must match the key prefix.
 *
 * Role requirements mirror the old upload-url endpoints:
 * - documents -> any authenticated user
 * - photos    -> administrator | teacher
 * - bulletins -> administrator
 *
 * Returns `{ key, file_url }` on success.
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");

    if (!key || key.length > 1024) {
      throw new BadRequestError("key is missing or too long");
    }
    const purpose = purposeFromKey(key);
    if (!purpose) {
      throw new BadRequestError("key must start with documents/, photos/ or bulletins/");
    }

    // Optional legacy param — must agree with the key prefix if provided.
    const purposeParam = searchParams.get("purpose");
    if (purposeParam && purposeParam !== purpose) {
      throw new BadRequestError("purpose query param does not match the key prefix");
    }

    if (purpose === "documents") {
      await requireRole();
    } else if (purpose === "photos") {
      await requireRole("administrator", "teacher");
    } else {
      await requireRole("administrator");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new BadRequestError("file is required (multipart field 'file')");
    }
    // Keep R2 costs/payload bounded (target cloud budget ~$100/mo).
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeError(
        `file exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1_048_576)} MB upload limit`,
      );
    }

    const bucket = getCloudflareContext().env.BUCKET;
    if (!bucket) {
      throw new Error("[files] BUCKET binding not configured (see wrangler.jsonc)");
    }

    const contentType = searchParams.get("contentType") || file.type || "application/octet-stream";
    const body = await file.arrayBuffer();
    await bucket.put(key, body, { httpMetadata: { contentType } });

    return NextResponse.json({
      key,
      file_url: `/api/files/${key}`,
      file_name: file.name,
      file_size: file.size,
      mime_type: contentType,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MiB
