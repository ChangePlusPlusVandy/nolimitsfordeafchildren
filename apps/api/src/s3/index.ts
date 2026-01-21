import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const region = process.env.S3_REGION || "sfo3";
const endpoint = process.env.S3_ENDPOINT || `https://${region}.digitaloceanspaces.com`;

// Detect if using local S3 (MinIO) vs production (DigitalOcean Spaces)
const isLocalS3 = endpoint.startsWith('http://localhost') || endpoint.includes('minio');

const s3Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  // Required for MinIO compatibility
  forcePathStyle: isLocalS3,
});

const bucket = process.env.S3_BUCKET_NAME!;

/**
 * Upload a file to S3
 * @param key - The key (path) where the file will be stored in S3
 * @param body - The file content (Buffer, ReadableStream, string, etc.)
 * @param contentType - Optional MIME type of the file
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  key: string,
  body: Buffer | ReadableStream | string | Uint8Array,
  contentType?: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  return getPublicUrl(key);
}

/**
 * Upload a large file to S3 using multipart upload
 * @param key - The key (path) where the file will be stored in S3
 * @param body - The file content
 * @param contentType - Optional MIME type of the file
 * @returns The URL of the uploaded file
 */
export async function uploadLargeFile(
  key: string,
  body: Buffer | ReadableStream | string | Uint8Array,
  contentType?: string
): Promise<string> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });

  await upload.done();
  
  return getPublicUrl(key);
}

/**
 * Get an object from S3
 * @param key - The key (path) of the file in S3
 * @returns The S3 GetObjectCommandOutput
 */
export async function getFile(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return s3Client.send(command);
}

/**
 * Delete a file from S3
 * @param key - The key (path) of the file to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}

export { s3Client, bucket };

/**
 * Generate a presigned URL for uploading a file to S3
 * NOTE: Requires @aws-sdk/s3-request-presigner package
 * Install with: npm install @aws-sdk/s3-request-presigner
 * @param key - The key (path) where the file will be stored in S3
 * @param contentType - The MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
 * @returns The presigned upload URL
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 900
): Promise<string> {
  // @ts-expect-error - requires @aws-sdk/s3-request-presigner package to be installed
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading a file from S3
 * NOTE: Requires @aws-sdk/s3-request-presigner package
 * Install with: npm install @aws-sdk/s3-request-presigner
 * @param key - The key (path) of the file in S3
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns The presigned download URL
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  // @ts-expect-error - requires @aws-sdk/s3-request-presigner package to be installed
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get the public URL for a file
 * Handles both local (MinIO) and production (DigitalOcean Spaces) URLs
 * @param key - The key (path) of the file in S3
 * @returns The public URL
 */
export function getPublicUrl(key: string): string {
  if (isLocalS3) {
    // Local MinIO: http://localhost:9000/bucket/key (path-style)
    return `${endpoint}/${bucket}/${key}`;
  }
  // DigitalOcean Spaces: https://bucket.region.digitaloceanspaces.com/key (virtual-hosted style)
  return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
}

/**
 * Extract the key from a full S3 URL
 * Handles both local (MinIO) and production (DigitalOcean Spaces) URL formats
 * @param url - The full S3 URL
 * @returns The key (path) portion of the URL
 */
export function extractKeyFromUrl(url: string): string | null {
  // Production URL format: https://bucket.region.digitaloceanspaces.com/key
  const prodBaseUrl = `https://${bucket}.${region}.digitaloceanspaces.com/`;
  if (url.startsWith(prodBaseUrl)) {
    return url.slice(prodBaseUrl.length);
  }
  
  // Local MinIO URL format: http://localhost:9000/bucket/key or http://minio:9000/bucket/key
  const localPattern = new RegExp(`^https?://[^/]+/${bucket}/(.+)$`);
  const match = url.match(localPattern);
  if (match?.[1]) {
    return match[1];
  }
  
  return null;
}

