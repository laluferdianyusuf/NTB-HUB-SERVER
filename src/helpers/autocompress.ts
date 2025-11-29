import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface CompressOptions {
  targetKB?: number;
  maxWidth?: number;
  minQuality?: number;
}

export const compressAndSaveImage = async (
  buffer: Buffer,
  uploadFolder = "uploads",
  options: CompressOptions = {}
) => {
  const { targetKB = 200, maxWidth = 1280, minQuality = 40 } = options;

  const uploadDir = path.join(process.cwd(), uploadFolder);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
  const outputPath = path.join(uploadDir, filename);

  let resized = await sharp(buffer).resize({ width: maxWidth }).toBuffer();
  let quality = 80;

  while (true) {
    const compressed = await sharp(resized).jpeg({ quality }).toBuffer();
    const sizeKB = compressed.length / 1024;

    if (sizeKB <= targetKB || quality <= minQuality) {
      await sharp(compressed).toFile(outputPath);
      return {
        filename,
        sizeKB: Number(sizeKB.toFixed(1)),
        qualityUsed: quality,
        path: outputPath,
      };
    }

    quality -= 5;
  }
};
