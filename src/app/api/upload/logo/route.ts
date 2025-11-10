import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";

// This endpoint handles client-side uploads to Vercel Blob for company logos
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Validate file type from pathname
        const extension = pathname.split('.').pop()?.toLowerCase();
        const validExts = ['jpg', 'jpeg', 'png', 'svg', 'webp'];

        if (!extension || !validExts.includes(extension)) {
          throw new Error(`Invalid file type. Supported: ${validExts.join(', ')}`);
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
          tokenPayload: JSON.stringify({
            // Optional: Add user authentication here
          }),
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
          addRandomSuffix: true,
          pathname: `company-logos/${Date.now()}-${pathname}`,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Logo upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload logo",
      },
      { status: 400 }
    );
  }
}