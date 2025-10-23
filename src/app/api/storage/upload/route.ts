import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";

const UploadUrlSchema = z.object({
  clientId: z.string(),
  filename: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UploadUrlSchema.parse(body);

    const result = await storage.getSignedUploadUrl(validated);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Storage upload error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Storage upload failed" },
      { status: 500 }
    );
  }
}
