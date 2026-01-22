import { S3Client } from "@aws-sdk/client-s3";

export function createStorageClient() {
  if (process.env.STORAGE_DRIVER === "minio") {
    return new S3Client({
      endpoint: process.env.MINIO_ENDPOINT,
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  //   AWS S#
  //   return new S3Client({
  //     region: process.env.AWS_REGION!,
  //     credentials: {
  //       accessKeyId: process.env.AWS_ACCESS_KEY!,
  //       secretAccessKey: process.env.AWS_SECRET_KEY!,
  //     },
  //   });

  throw new Error("Invalid storage driver");
}
