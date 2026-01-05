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
  params: (req, file) => {
    try {
      const parsed = path.parse(file.originalname || "cv");
      const baseName = parsed.name || "cv";
      const safeName = baseName.replace(/[^a-zA-Z0-9-_]+/g, "-");
      const publicId = `cv-${Date.now()}-${safeName}`.replace(/-+/g, "-");

      const ext = (file.originalname || "").split(".").pop()?.toLowerCase();
      const isPdf = ext === "pdf";

      const params = {
        folder: "job_app_cvs",
        resource_type: isPdf ? "raw" : "auto",
        allowed_formats: ["pdf", "doc", "docx"],
        public_id: publicId,
      };

      if (!isPdf) {
        params.transformation = [];
      }

      return params;
    } catch (error) {
      throw error;
    }
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

export const uploadCV = multer({
  storage: storageCV,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error(
        "[Multer] File rejected - Invalid MIME type:",
        file.mimetype
      );
      cb(
        new Error(`File type not allowed. Allowed types: PDF, DOC, DOCX`),
        false
      );
    }
  },
});

export const uploadImage = multer({ storage: storageImage });