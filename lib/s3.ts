import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { hasS3Env } from "@/lib/env";

function getClient() {
  if (!hasS3Env()) {
    return null;
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  });
}

export async function createUploadUrl(key: string, contentType: string) {
  const client = getClient();
  if (!client) {
    return null;
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(client, command, { expiresIn: 900 });
}

export async function createDownloadUrl(key: string) {
  const client = getClient();
  if (!client) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  });

  return getSignedUrl(client, command, { expiresIn: 900 });
}
