import "server-only";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream } from "node:fs";
import { RECORDING_BUCKET } from "./config";
function configuration() {
  const endpoint = process.env.RECORDING_S3_ENDPOINT,
    accessKeyId = process.env.RECORDING_S3_ACCESS_KEY,
    secretAccessKey = process.env.RECORDING_S3_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey)
    throw new Error("El archivo privado de Soflia no está configurado.");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Endpoint de archivo inválido.");
  return new S3Client({
    endpoint,
    region: process.env.RECORDING_S3_REGION || "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    maxAttempts: 3,
  });
}
export async function storeRecording(
  file: string,
  key: string,
  signal: AbortSignal,
) {
  const client = configuration();
  const source = createReadStream(file);
  const upload = new Upload({
    client,
    params: {
      Bucket: RECORDING_BUCKET,
      Key: key,
      Body: source,
      ContentType: "video/mp4",
      CacheControl: "private, no-store",
    },
    partSize: 8 * 1024 * 1024,
    queueSize: 2,
    leavePartsOnError: false,
  });
  const cancel = () => void upload.abort();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    signal.throwIfAborted();
    await upload.done();
  } finally {
    signal.removeEventListener("abort", cancel);
    source.destroy();
    client.destroy();
  }
}
export async function removeRecording(key: string) {
  const client = configuration();
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: RECORDING_BUCKET, Key: key }),
    );
  } finally {
    client.destroy();
  }
}
