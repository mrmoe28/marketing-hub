import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";

// This endpoint handles client-side uploads to Vercel Blob
// Bypasses API route body size limits by using direct client uploads
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Validate file type from pathname
        const extension = pathname.split('.').pop()?.toLowerCase();
        const validImageExts = ['jpg', 'jpeg', 'png', 'svg', 'webp'];
        const validVideoExts = ['mp4', 'webm', 'ogg', 'mov'];
        const validExts = [...validImageExts, ...validVideoExts];

        if (!extension || !validExts.includes(extension)) {
          throw new Error(`Invalid file type. Supported: ${validExts.join(', ')}`);
        }

        const isVideo = validVideoExts.includes(extension);
        const folder = isVideo ? "email-videos" : "email-images";

        return {
          allowedContentTypes: isVideo
            ? ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
            : ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
          tokenPayload: JSON.stringify({
            // Optional: Add user authentication here
          }),
          maximumSizeInBytes: isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024, // 50MB for videos, 5MB for images
          addRandomSuffix: true,
          pathname: `${folder}/${Date.now()}-${pathname}`,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 400 }
    );
  }
}
