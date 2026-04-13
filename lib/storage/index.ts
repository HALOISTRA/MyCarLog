import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "",
  },
  forcePathStyle: true, // needed for MinIO
});

const BUCKET = process.env.STORAGE_BUCKET ?? "vehicle-passport";

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = "uploads"
): Promise<UploadResult> {
  const ext = originalName.split(".").pop() ?? "bin";
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  const url = `${process.env.STORAGE_PUBLIC_URL}/${key}`;
  return { key, url };
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

export function getPublicUrl(key: string): string {
  return `${process.env.STORAGE_PUBLIC_URL}/${key}`;
}

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
