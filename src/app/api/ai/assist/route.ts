import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_BASE_URL;
    const model = process.env.MODEL_NAME || "gpt-3.5-turbo";

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey,
      ...(baseURL && { baseURL })
    });

    const systemMessage = `You are an AI assistant helping to improve email content.
The user will provide you with their current email HTML content and ask you to make specific changes.
You should return ONLY the modified HTML content, nothing else.
Preserve all existing HTML structure, styling, and formatting unless specifically asked to change it.`;

    const userMessage = context
      ? `Current email content:\n${context}\n\nUser request: ${prompt}`
      : `User request: ${prompt}`;

    const response = await openai.chat.completions.create({
      model,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });

    const result = response.choices[0]?.message?.content || context || "";

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
