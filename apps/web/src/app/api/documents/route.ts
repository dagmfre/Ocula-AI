import { auth } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import {
  getDocumentsByPlatformId,
  getDocumentById,
  deleteDocument,
  getPlatformByUserId,
} from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/documents — list all documents for the user's platform
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = getPlatformByUserId(session.user.id);
  if (!platform) {
    return NextResponse.json({ documents: [] });
  }

  const documents = getDocumentsByPlatformId(platform.id);
  return NextResponse.json({ documents });
}

// DELETE /api/documents — delete a document by id (passed as query param ?id=...)
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = getPlatformByUserId(session.user.id);
  if (!platform) {
    return NextResponse.json({ error: "No platform" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get("id");
  if (!docId) {
    return NextResponse.json({ error: "Missing document id" }, { status: 400 });
  }

  const doc = getDocumentById(docId);
  if (!doc || doc.platformId !== platform.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Delete from Cloudinary
  try {
    await deleteFromCloudinary(doc.cloudinaryPublicId, doc.type);
  } catch (err) {
    console.error("Cloudinary delete failed:", err);
    // Continue with DB deletion even if Cloudinary fails
  }

  deleteDocument(docId);
  return NextResponse.json({ success: true });
}
