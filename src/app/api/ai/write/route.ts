import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { claudeWriteEmail } from "@/lib/ai";

const WriteEmailSchema = z.object({
  brand: z.string().min(1),
  audience: z.string().min(1),
  goal: z.string().min(1),
  details: z.string().min(1),
  draft: z.string().optional(),
  stylePreset: z.enum(["friendly", "professional", "casual"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = WriteEmailSchema.parse(body);

    const result = await claudeWriteEmail(validated);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI write error:", error);

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
      { error: error instanceof Error ? error.message : "AI write failed" },
      { status: 500 }
    );
  }
}
