import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError } from "@/server/shared/errors";
import { errorResponse, validateKey } from "../_shared";

/**
 * POST /api/files/upload?key=<key>&purpose=<documents|photos|bulletins>
 *
 * Authenticated direct-to-R2 upload, replacing the S3 presigned-upload-URL
 * flow (R2 has no S3 presigning). The client first calls the domain's
 * upload-url action (which validates entity/role rules and generates the
 * key), then POSTs the file here as multipart field `file`.
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
    const purpose = searchParams.get("purpose");
    const key = searchParams.get("key");

    if (!purpose || !["documents", "photos", "bulletins"].includes(purpose)) {
      throw new BadRequestError("purpose must be one of: documents, photos, bulletins");
    }
    if (purpose === "documents") {
      await requireRole();
    } else if (purpose === "photos") {
      await requireRole("administrator", "teacher");
    } else {
      await requireRole("administrator");
    }

    if (!key || !validateKey(key, purpose)) {
      throw new BadRequestError("key is missing or invalid");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new BadRequestError("file is required (multipart field 'file')");
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
