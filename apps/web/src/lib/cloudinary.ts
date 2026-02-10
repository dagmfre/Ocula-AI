import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

// Configure Cloudinary once
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type FileType = "pdf" | "image" | "markdown";

const MIME_TO_TYPE: Record<string, FileType> = {
  "application/pdf": "pdf",
  "image/png": "image",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/webp": "image",
  "text/markdown": "markdown",
  "text/plain": "markdown", // .md files sometimes come as text/plain
};

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "md"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function getFileType(mimeType: string, filename: string): FileType | null {
  // Try by mime type first
  if (MIME_TO_TYPE[mimeType]) return MIME_TO_TYPE[mimeType];

  // Fall back to extension
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "md") return "markdown";
  if (["png", "jpg", "jpeg", "webp"].includes(ext ?? "")) return "image";

  return null;
}

export function isAllowedFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext ?? "");
}

export function isAllowedSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE;
}

export interface UploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
}

/**
 * Upload a file buffer to Cloudinary.
 * Uses the `raw` resource_type for PDFs/markdown, `image` for images.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  fileType: FileType,
  platformId: string,
): Promise<UploadResult> {
  const resourceType = fileType === "image" ? "image" : "raw";
  const folder = `ocula/${platformId}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
        public_id: `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        overwrite: false,
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary.
 */
export async function deleteFromCloudinary(
  publicId: string,
  fileType: FileType,
): Promise<void> {
  const resourceType = fileType === "image" ? "image" : "raw";
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
