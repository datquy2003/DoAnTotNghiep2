import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storageCV = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "job_app_cvs",
    resource_type: "auto",
    allowed_formats: ["pdf", "doc", "docx"],
    public_id: (req, file) => {
      const parsed = path.parse(file.originalname || "cv");
      const baseName = parsed.name || "cv";
      const safeName = baseName.replace(/[^a-zA-Z0-9-_]+/g, "-");
      return `cv-${Date.now()}-${safeName}`.replace(/-+/g, "-");
    },
  },
});

const storageImage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "job_app_images",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

export const uploadCV = multer({ storage: storageCV });
export const uploadImage = multer({ storage: storageImage });