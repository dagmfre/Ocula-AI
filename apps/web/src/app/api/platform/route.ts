import { auth } from "@/lib/auth";
import { createPlatform, getPlatformByUserId } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/platform — get the current user's platform
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = getPlatformByUserId(session.user.id);
  return NextResponse.json({ platform: platform ?? null });
}

// POST /api/platform — create a platform (onboarding)
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already has a platform
  const existing = getPlatformByUserId(session.user.id);
  if (existing) {
    return NextResponse.json(
      { error: "Platform already exists", platform: existing },
      { status: 409 },
    );
  }

  const body = await request.json();

  // Validate required fields
  const required = [
    "platformName",
    "platformUrl",
    "contactName",
    "contactRole",
    "companySize",
    "industry",
  ] as const;

  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
      return NextResponse.json(
        { error: `${field} is required` },
        { status: 400 },
      );
    }
  }

  // Validate companySize enum
  const validSizes = ["1-10", "11-50", "51-200", "200+"];
  if (!validSizes.includes(body.companySize)) {
    return NextResponse.json(
      { error: "companySize must be one of: 1-10, 11-50, 51-200, 200+" },
      { status: 400 },
    );
  }

  try {
    const platform = createPlatform({
      userId: session.user.id,
      platformName: body.platformName.trim(),
      platformUrl: body.platformUrl.trim(),
      contactName: body.contactName.trim(),
      contactRole: body.contactRole.trim(),
      companySize: body.companySize,
      industry: body.industry.trim(),
      useCase: body.useCase?.trim() || undefined,
    });

    return NextResponse.json({ platform }, { status: 201 });
  } catch (err) {
    console.error("Failed to create platform:", err);
    return NextResponse.json(
      { error: "Failed to create platform" },
      { status: 500 },
    );
  }
}
