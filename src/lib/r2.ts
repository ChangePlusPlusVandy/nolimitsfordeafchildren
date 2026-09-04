import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * R2 storage helpers (replacing the old DigitalOcean-Spaces/S3 module from
 * the Express app). All binding access happens inside functions — never at
 * module top-level.
 *
 * NOTE: R2 has no presigned-URL flow like S3. Uploads should use the
 * Workers runtime directly (`BUCKET.put`) or a direct-to-R2 upload via the
 * `wrangler r2 object put`/presigned URLs through a service binding. The
 * presigned helpers below are kept as explicit stubs so ported services
 * typecheck; the upload flow is replaced by direct `put` calls in the
 * documents/photos route-handler porting task.
 */

function getBucket(): R2Bucket {
  const bucket = getCloudflareContext().env.BUCKET;
  if (!bucket) {
    throw new Error("[r2] BUCKET binding not configured (see wrangler.jsonc)");
  }
  return bucket;
}

/** Upload a file to R2. Returns the object key (see getPublicUrl). */
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
 * Public URL for an object. R2 buckets in workers.dev/public access mode are
 * served from `https://pub-<hash>.r2.dev/<key>`; the token/URL must be
 * configured per bucket. For private buckets use getFile() / a route that
 * streams the body.
 *
 * TODO(r2): configure a custom public domain for the bucket and replace the
 * placeholder below, or serve downloads through a route handler.
 */
export function getPublicUrl(key: string): string {
  return `https://${getBucketName()}.r2.dev/${key}`;
}

function getBucketName(): string {
  // R2Bucket does not expose its name at runtime; read it from the wrangler
  // config convention until a public domain is configured.
  return "nolimits-bucket";
}

/** Extract the key from an R2 public URL (mirrors the S3 helper). */
export function extractKeyFromUrl(url: string): string | null {
  const prefixes = [`https://${getBucketName()}.r2.dev/`, `https://pub-${getBucketName()}.r2.dev/`];
  for (const prefix of prefixes) {
    if (url.startsWith(prefix)) {
      return url.slice(prefix.length);
    }
  }
  return null;
}

/**
 * NOT SUPPORTED on R2 (there is no S3-style presigning without a public
 * S3-compatible endpoint configured). Route handlers should upload directly
 * via uploadFile() instead.
 */
export async function getPresignedUploadUrl(
  _key: string,
  _contentType: string,
  _expiresIn: number = 900,
): Promise<string> {
  throw new Error(
    "[r2] getPresignedUploadUrl is not supported on R2. Use uploadFile() (direct Workers upload) instead.",
  );
}

/** NOT SUPPORTED on R2 — see getPresignedUploadUrl. */
export async function getPresignedDownloadUrl(
  _key: string,
  _expiresIn: number = 3600,
): Promise<string> {
  throw new Error(
    "[r2] getPresignedDownloadUrl is not supported on R2. Use getFile() or a download route instead.",
  );
}
