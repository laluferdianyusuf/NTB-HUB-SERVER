import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createStorageClient } from "../config/s3Client";
import sharp from "sharp";
import { v4 as uuid } from "uuid";

const s3 = createStorageClient();

export async function uploadImage({
  file,
  folder = "images",
}: {
  file: Express.Multer.File;
  folder?: string;
}) {
  const buffer = await sharp(file.buffer)
    .resize(1280)
    .png({ quality: 80 })
    .toBuffer();

  const key = `${folder}/${uuid()}.png`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    }),
  );

  return {
    key,
    url: `${process.env.PUBLIC_STORAGE_URL}/${key}`,
  };
}