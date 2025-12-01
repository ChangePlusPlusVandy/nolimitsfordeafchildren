import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const region = process.env.S3_REGION || "sfo3";
const endpoint = process.env.S3_ENDPOINT || `https://${region}.digitaloceanspaces.com`;

const s3Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
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
  
  return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
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
  
  return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
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

