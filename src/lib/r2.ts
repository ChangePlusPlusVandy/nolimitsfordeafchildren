import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * R2 storage helpers (replacing the old DigitalOcean-Spaces/S3 module from
 * the Express app). All binding access happens inside functions — never at
 * module top-level.
 *
 * R2 has NO S3-style presigned URLs (no public S3-compatible endpoint is
 * configured). Uploads/downloads go through the app's own route handlers
 * instead, so every object access is authenticated:
 *
 * - Upload:    `POST /api/files/upload?key=...&purpose=...` (route handler),
 *              which validates the session and `BUCKET.put`s the file.
 * - Download:  `GET /api/files/<key>` (route handler), which validates the
 *              session and streams the object body. No public r2.dev URLs
 *              are ever handed to clients (PII safety).
 */

function getBucket(): R2Bucket {
  const bucket = getCloudflareContext().env.BUCKET;
  if (!bucket) {
    throw new Error("[r2] BUCKET binding not configured (see wrangler.jsonc)");
  }
  return bucket;
}

/** Upload a file to R2. Returns the object key's app URL (see getPublicUrl). */
export async function uploadFile(
  key: string,
  body: ReadableStream | ArrayBuffer | ArrayBufferView | Blob | string,
  contentType?: string,
): Promise<string> {
  const bucket = getBucket();
  await bucket.put(key, body, {
    ...(contentType ? { httpMetadata: { contentType } } : {}),
  });
  return getPublicUrl(key);
}

/**
 * R2 supports large uploads via multipart; for the scaffold this is the
 * same as uploadFile (single put supports up to ~5GiB). Multipart upload
 * can be added via `createMultipartUpload` if needed.
 */
export async function uploadLargeFile(
  key: string,
  body: ReadableStream | ArrayBuffer | ArrayBufferView | Blob | string,
  contentType?: string,
): Promise<string> {
  return uploadFile(key, body, contentType);
}

/** Get an object from R2. */
export async function getFile(key: string): Promise<R2ObjectBody | null> {
  return getBucket().get(key);
}

/** Delete an object from R2. */
export async function deleteFile(key: string): Promise<void> {
  await getBucket().delete(key);
}

/**
 * App-relative URL for a stored object. The `/api/files/<key>` route handler
 * authenticates the session before streaming the object — this replaces
 * `getPresignedDownloadUrl`/`getPublicUrl` (r2.dev public URLs) for PII
 * safety. Relative so it works on any deployment origin.
 */
export function getPublicUrl(key: string): string {
  return `/api/files/${key}`;
}

/**
 * Upload target for a file. The client `POST`s the file (multipart field
 * `file`) to this URL after obtaining it from the upload-url action; the
 * route handler authenticates and validates the key prefix, then returns
 * `{ key, file_url }`.
 */
export function getUploadUrl(key: string, contentType?: string): string {
  const params = new URLSearchParams({ key });
  if (contentType) params.set("contentType", contentType);
  return `/api/files/upload?${params.toString()}`;
}

/** Extract the key from a stored URL (route URL or legacy r2.dev prefix). */
export function extractKeyFromUrl(url: string): string | null {
  const routePrefix = "/api/files/";
  if (url.startsWith(routePrefix)) {
    const withoutPrefix = url.slice(routePrefix.length);
    return withoutPrefix.split("?")[0].split("#")[0];
  }
  const prefixes = [`https://${getBucketName()}.r2.dev/`, `https://pub-${getBucketName()}.r2.dev/`];
  for (const prefix of prefixes) {
    if (url.startsWith(prefix)) {
      const withoutPrefix = url.slice(prefix.length);
      return withoutPrefix.split("?")[0].split("#")[0];
    }
  }
  return null;
}

function getBucketName(): string {
  // R2Bucket does not expose its name at runtime; read it from the wrangler
  // config convention until a public domain is configured.
  return "nolimits-r2-staging";
}

/**
 * NOT SUPPORTED on R2 (no S3-style presigning without a public S3-compatible
 * endpoint). Use `getUploadUrl` (authenticated direct-upload route) instead.
 */
export async function getPresignedUploadUrl(
  _key: string,
  _contentType: string,
  _expiresIn: number = 900,
): Promise<string> {
  throw new Error(
    "[r2] getPresignedUploadUrl is not supported on R2. Use getUploadUrl() (authenticated upload route) instead.",
  );
}

/** NOT SUPPORTED on R2 — see getPresignedUploadUrl. Use getPublicUrl() instead. */
export async function getPresignedDownloadUrl(
  _key: string,
  _expiresIn: number = 3600,
): Promise<string> {
  throw new Error(
    "[r2] getPresignedDownloadUrl is not supported on R2. Use the /api/files/<key> download route instead.",
  );
}
