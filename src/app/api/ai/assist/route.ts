import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Set longer timeout for AI responses
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, context } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const systemMessage = `You are an AI assistant helping to improve email content.
The user will provide you with their current email HTML content and ask you to make specific changes.
You should return ONLY the modified HTML content, nothing else.
Preserve all existing HTML structure, styling, and formatting unless specifically asked to change it.`;

    const userMessage = context
      ? `Current email content:\n${context}\n\nUser request: ${prompt}`
      : `User request: ${prompt}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: systemMessage,
      messages: [
        { role: "user", content: userMessage },
      ],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const result = textBlock?.text || context || "";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI assist error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "AI assist failed",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
