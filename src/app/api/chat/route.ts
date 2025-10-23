import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

// Set longer timeout for AI responses
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { message, includeClientData } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let context = "";

    // Optionally include client data summary
    if (includeClientData) {
      const clients = await db.client.findMany({
        take: 50, // Limit to avoid token limits
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const clientCount = await db.client.count();
      const customFieldSample = clients[0]?.customFields || {};

      context = `
You have access to a client database with ${clientCount} clients. Here's a sample of the data:

Recent clients (showing ${clients.length}):
${clients.slice(0, 10).map((c, i) => `
${i + 1}. ${c.email}
   Name: ${c.firstName || ""} ${c.lastName || ""}
   Location: ${c.city || "N/A"}, ${c.state || "N/A"}
   Tags: ${c.tags.map((t) => t.tag.name).join(", ") || "None"}
   ${c.customFields ? `Custom data: ${JSON.stringify(c.customFields)}` : ""}
`).join("")}

Custom fields available: ${Object.keys(customFieldSample).join(", ")}
`;
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a helpful AI assistant for Clientbase, an email marketing platform.

You help users understand their client data, answer questions about their imported information, and provide insights.

${context}

Be concise, friendly, and actionable. If asked about specific data or statistics, reference the actual client data provided.
If you need to search the web for information (like best practices, regulations, etc.), mention that you can do that.`,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({
      response: text,
      clientDataIncluded: includeClientData,
    });
  } catch (error) {
    console.error("Chat error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // Provide user-friendly error messages
    let errorMessage = "Failed to connect to AI service. Please try again.";

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "AI service authentication failed. Please contact support.";
      } else if (error.message.includes("timeout") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Connection timeout. Please check your internet and try again.";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
