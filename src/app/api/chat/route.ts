import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import OpenAI from "openai";

// Set longer timeout for AI responses
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log("Chat API called");

  try {
    const body = await request.json();
    console.log("Request body:", { hasMessage: !!body.message, includeClientData: body.includeClientData });

    const { message, includeClientData } = body;

    if (!message) {
      console.error("No message provided");
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("API key status:", apiKey ? `Present (${apiKey.substring(0, 10)}...)` : "Missing");

    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 500 }
      );
    }

    console.log("Initializing OpenAI client...");
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    let context = "";
    console.log("Building context, includeClientData:", includeClientData);

    // Optionally include client data summary
    if (includeClientData) {
      try {
        console.log("Fetching client data...");
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
        console.log(`Found ${clientCount} clients, fetched ${clients.length}`);
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
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue without client data if DB fails
        context = "";
      }
    }

    console.log("Calling OpenAI API...");
    console.log("Model:", "gpt-4o-mini");
    console.log("Max tokens:", 1024);
    console.log("API Key check:", apiKey.substring(0, 20));

    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant for Clientbase, an email marketing platform.

You help users understand their client data, answer questions about their imported information, and provide insights.

${context}

IMPORTANT: When you have access to client data (above), ALWAYS use it to answer questions about clients, statistics, counts, locations, etc. Never give generic responses when you have the actual data.

Be concise, friendly, and actionable. If asked about specific data or statistics, reference the actual client data provided.
If you need to search the web for information (like best practices, regulations, etc.), mention that you can do that.`
          },
          {
            role: "user",
            content: message,
          },
        ],
      });
      console.log("✅ OpenAI API call successful!");
    } catch (apiError: any) {
      console.error("❌ OpenAI API call failed");
      console.error("Error name:", apiError?.name);
      console.error("Error message:", apiError?.message);
      console.error("Error status:", apiError?.status);
      console.error("Error type:", apiError?.type);
      console.error("Error error:", JSON.stringify(apiError?.error, null, 2));
      console.error("Full error object:", JSON.stringify(apiError, Object.getOwnPropertyNames(apiError), 2));
      throw apiError;
    }

    console.log("Got response from OpenAI");
    const text = response.choices[0]?.message?.content || "";

    console.log("Sending response to client");
    return NextResponse.json({
      response: text,
      clientDataIncluded: includeClientData,
    });
  } catch (error) {
    // Log full error details for debugging
    console.error("=== CHAT API ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Log OpenAI-specific error details if available
    if (error && typeof error === "object" && "status" in error) {
      console.error("HTTP Status:", (error as any).status);
      console.error("Error response:", (error as any).error);
    }

    // Provide user-friendly error messages
    let errorMessage = "Failed to connect to AI service. Please try again.";
    let debugInfo = "";

    if (error instanceof Error) {
      debugInfo = error.message;

      if (error.message.includes("API key") || error.message.includes("401")) {
        errorMessage = "AI service authentication failed. Please contact support.";
      } else if (error.message.includes("timeout") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Connection timeout. Please check your internet and try again.";
      } else if (error.message.includes("rate limit") || error.message.includes("429")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.message.includes("model")) {
        errorMessage = "AI model configuration error. Please contact support.";
      }
    }

    console.error("Sending error response:", errorMessage);
    console.error("Debug info:", debugInfo);

    return NextResponse.json(
      {
        error: errorMessage,
        debug: process.env.NODE_ENV === "development" ? debugInfo : undefined
      },
      { status: 500 }
    );
  }
}
