import { auth } from "@/lib/auth";
import {
  uploadToCloudinary,
  getFileType,
  isAllowedFile,
  isAllowedSize,
} from "@/lib/cloudinary";
import { createDocument, getPlatformByUserId } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/upload — upload a file to Cloudinary and save a document record
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = getPlatformByUserId(session.user.id);
  if (!platform) {
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file name/extension
    if (!isAllowedFile(file.name)) {
      return NextResponse.json(
        { error: "File type not allowed. Supported: PDF, PNG, JPG, WEBP, MD" },
        { status: 400 },
      );
    }

    // Validate size
    if (!isAllowedSize(file.size)) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB" },
        { status: 400 },
      );
    }

    // Determine file type
    const fileType = getFileType(file.type, file.name);
    if (!fileType) {
      return NextResponse.json(
        { error: "Could not determine file type" },
        { status: 400 },
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      buffer,
      file.name,
      fileType,
      platform.id,
    );

    // Save document record in the database
    const document = createDocument({
      platformId: platform.id,
      type: fileType,
      cloudinaryUrl: uploadResult.url,
      cloudinaryPublicId: uploadResult.publicId,
      filename: file.name,
      sizeBytes: uploadResult.bytes,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
