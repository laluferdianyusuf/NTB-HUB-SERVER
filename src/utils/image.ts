import cloudinary from "../config/cloudinary";
import fs from "fs/promises";

export const uploadToCloudinary = async (
  filePath: string,
  folder = "uploads"
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: true,
      unique_filename: true,
      resource_type: "image",
    });

    await fs.unlink(filePath);

    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw new Error("Failed to upload image to Cloudinary");
  }
};
