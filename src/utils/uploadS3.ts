import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createStorageClient } from "config/s3Client";
import sharp from "sharp";

const s3 = createStorageClient();

export async function uploadImage({
  file,
  folder = "images",
}: {
  file: Express.Multer.File;
  folder: string;
}) {
  const buffer = await sharp(file.buffer)
    .resize(1280)
    .png({ quality: 80 })
    .toBuffer();

  const key = `${folder}/${Date.now()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
    }),
  );

  return {
    url: `${process.env.PUBLIC_STORAGE_URL}/${process.env.MINIO_BUCKET}/${key}`,
  };
}
