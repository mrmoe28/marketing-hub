import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml", "image/webp"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    const validTypes = [...validImageTypes, ...validVideoTypes];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: JPEG, PNG, SVG, WebP, MP4, WebM, OGG, MOV" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for images, 50MB for videos)
    const isVideo = validVideoTypes.includes(file.type);
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for video, 5MB for images
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${isVideo ? '50MB' : '5MB'}` },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const folder = isVideo ? "email-videos" : "email-images";
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Image upload failed",
      },
      { status: 500 }
    );
  }
}
