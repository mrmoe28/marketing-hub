import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import OpenAI from "openai";
import { agentTools, executeAgentTool } from "@/lib/agent-tools";

// Set longer timeout for AI responses
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Convert agent tools to OpenAI format
const convertToolsToOpenAIFormat = (): OpenAI.Chat.Completions.ChatCompletionTool[] => {
  return agentTools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
};

// Legacy tools for backwards compatibility (OpenAI format)
const legacyTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_email_template",
      description: "Create and save a new email template. Use this when the user asks you to create, draft, or design an email template.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "A descriptive name for the template (e.g., 'Welcome Email', 'Monthly Newsletter')"
          },
          subject: {
            type: "string",
            description: "The email subject line"
          },
          bodyHtml: {
            type: "string",
            description: "The HTML body of the email with proper formatting, styling, and structure"
          },
          bodyText: {
            type: "string",
            description: "Plain text version of the email body"
          },
          category: {
            type: "string",
            description: "Category of the template (e.g., 'welcome', 'promotion', 'newsletter', 'update')"
          },
          description: {
            type: "string",
            description: "Brief description of what this template is for"
          }
        },
        required: ["name", "subject", "bodyHtml", "bodyText"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_company_profile",
      description: "Get the company profile information including name, logo, branding, and contact details. Use this to personalize email templates.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_templates",
      description: "Get a list of all saved email templates",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_template",
      description: "Get full details of a specific template by ID, including the HTML body for preview. Use this when the user wants to see or preview a template.",
      parameters: {
        type: "object",
        properties: {
          templateId: {
            type: "string",
            description: "The ID of the template to retrieve"
          }
        },
        required: ["templateId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_booking_page_url",
      description: "Get the public booking page URL where customers can schedule appointments. Use this when users ask about booking, scheduling, or appointments.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

// Function implementations
async function createEmailTemplate(args: any) {
  const template = await db.emailTemplate.create({
    data: {
      name: args.name,
      subject: args.subject,
      bodyHtml: args.bodyHtml,
      bodyText: args.bodyText,
      category: args.category || null,
      description: args.description || null,
      isAiCreated: true,
    },
  });
  return { success: true, template };
}

async function getCompanyProfile() {
  const profile = await db.companyProfile.findFirst();
  return profile || { companyName: "Your Company" };
}

async function listTemplates() {
  const templates = await db.emailTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      subject: true,
      category: true,
      description: true,
      isAiCreated: true,
      createdAt: true,
    }
  });
  return templates;
}

async function getTemplate(args: any) {
  const template = await db.emailTemplate.findUnique({
    where: { id: args.templateId },
  });

  if (!template) {
    return { error: "Template not found" };
  }

  return template;
}

async function getBookingPageUrl() {
  // Get the base URL from environment or use default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  return {
    url: `${baseUrl}/book`,
    message: "Customers can book appointments at this link. The booking page is mobile-friendly and requires no account."
  };
}

// Combine all available tools
const getAllTools = () => {
  return [...legacyTools, ...convertToolsToOpenAIFormat()];
};

export async function POST(request: NextRequest) {
  console.log("Chat API called");

  try {
    const body = await request.json();
    console.log("Request body:", { hasMessage: !!body.message, includeClientData: body.includeClientData });

    const { message, includeClientData, conversationId } = body;

    if (!message) {
      console.error("No message provided");
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Load existing conversation if provided
    let existingConversation = null;
    let conversationMessages: any[] = [];

    if (conversationId) {
      existingConversation = await db.conversationHistory.findUnique({
        where: { id: conversationId },
      });

      if (existingConversation) {
        conversationMessages = existingConversation.messages as any[];
      }
    }

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_BASE_URL;
    const model = process.env.MODEL_NAME || "gpt-3.5-turbo";

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
      apiKey,
      ...(baseURL && { baseURL })
    });

    let context = "";
    console.log("Building context, includeClientData:", includeClientData);

    // Optionally include client data summary
    if (includeClientData) {
      try {
        console.log("Fetching client data...");
        const clients = await db.client.findMany({
          take: 10,
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

        // Build context with client data, avoiding nested JSON.stringify
        const clientSummaries = clients.map((c, i) => {
          const customFieldsText = c.customFields
            ? Object.entries(c.customFields as Record<string, any>)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")
            : "";

          return `${i + 1}. ${c.email}
   Name: ${c.firstName || ""} ${c.lastName || ""}
   Location: ${c.city || "N/A"}, ${c.state || "N/A"}
   Tags: ${c.tags.map((t) => t.tag.name).join(", ") || "None"}
   ${customFieldsText ? `Custom data: ${customFieldsText}` : ""}`;
        }).join("\n\n");

        context = `
You have access to a client database with ${clientCount} clients. Here's a sample of the data:

Recent clients (showing ${clients.length}):
${clientSummaries}

Custom fields available: ${Object.keys(customFieldSample).join(", ")}
`;
      } catch (dbError) {
        console.error("Database error:", dbError);
        context = "";
      }
    }

    console.log("Calling OpenAI API with function calling...");
    console.log("Context length:", context.length);
    console.log("Context preview:", context.substring(0, 200));

    // Build system message for OpenAI
    const systemPrompt = `You are an autonomous AI assistant for a Marketing Hub CRM and email marketing platform.

You have FULL CONTROL to perform actions on behalf of the user. Be proactive and helpful.

${context}

IMPORTANT: When you have access to client data (above), ALWAYS use it to answer questions about clients, statistics, counts, locations, etc. Never give generic responses when you have the actual data.

🎯 YOUR CAPABILITIES:

📧 CAMPAIGN MANAGEMENT:
- createCampaign: Create and send email campaigns to clients
- sendCampaign: Start sending a campaign immediately
- getCampaignStats: Analyze campaign performance (open rates, click rates, etc.)

📝 TEMPLATE MANAGEMENT:
- createEmailTemplate: Create professional email templates with HTML formatting
- updateEmailTemplate: Modify existing templates
- sendTestEmail: Send test emails to verify template appearance
- listTemplates: Browse all available templates
- get_template: Get full details of a specific template

👥 CLIENT MANAGEMENT:
- searchClients: Find clients by location, tags, or search query
- addClient: Add new clients to the database
- tagClients: Organize clients with tags
- getClientStats: Get insights about client distribution and demographics

📅 BOOKING MANAGEMENT:
- createBooking: Schedule appointments for clients
- updateBookingStatus: Change booking status (confirm, cancel, complete)
- listBookings: View upcoming and past bookings

📊 COMPANY INFO:
- get_company_profile: Access company branding and contact details
- get_booking_page_url: Get the public booking page link

🚀 HOW TO BE AUTONOMOUS:

1. When asked to "create a campaign for clients in Georgia":
   - Use searchClients to find Georgia clients
   - Use createCampaign with those client IDs
   - Report back with results

2. When asked to "send a follow-up email to hot leads":
   - Search for clients tagged "hot-lead"
   - Create a template if needed
   - Create and send campaign
   - Show stats

3. When asked about performance:
   - Use getCampaignStats
   - Analyze the data
   - Provide actionable insights

4. When managing bookings:
   - Use createBooking for new appointments
   - Use listBookings to check availability
   - Use updateBookingStatus to manage appointments

ALWAYS execute actions when asked. Don't just explain what could be done - DO IT.
Be proactive, autonomous, and helpful. Remember context from previous messages.`;

    // Build messages array for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add system message first
    messages.push({
      role: "system",
      content: systemPrompt,
    });

    // Add conversation history if exists (filter out system messages)
    if (conversationMessages.length > 0) {
      conversationMessages.slice(-10).forEach((msg: any) => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          });
        }
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    console.log("About to call OpenAI API");
    console.log("Messages count:", messages.length);
    console.log("System prompt length:", systemPrompt.length);
    console.log("Tools count:", getAllTools().length);

    let response;
    let toolsSupported = true;
    try {
      response = await openai.chat.completions.create({
        model,
        max_tokens: 4096,
        messages,
        tools: getAllTools(),
      });
      console.log("OpenAI API call successful");
    } catch (apiError: any) {
      console.error("OpenAI API error details:", {
        message: apiError.message,
        status: apiError.status,
        type: apiError.type,
        error: apiError.error,
        code: apiError.code
      });
      
      // Check if model doesn't support tools
      if (apiError.message?.includes("does not support tools") || 
          apiError.message?.includes("tools are not supported") ||
          apiError.status === 400 && apiError.message?.includes("tools")) {
        console.log("Model doesn't support tools, falling back to non-tool mode");
        toolsSupported = false;
        
        // Retry without tools, but with enhanced system prompt that includes data access instructions
        try {
          // Enhance system prompt for non-tool mode
          const enhancedSystemPrompt = systemPrompt + `

NOTE: This model does not support function calling. You can still help the user by:
- Answering questions about their data based on the context provided
- Providing general advice about email marketing, campaigns, and client management
- Explaining features and capabilities of the system
- If the user asks about specific data (like client counts, locations, etc.), use the context information provided above.

You cannot directly perform actions like creating campaigns or templates, but you can guide the user on how to do these things.`;

          // Update system message
          const messagesWithoutTools = messages.map((msg, idx) => {
            if (idx === 0 && msg.role === "system") {
              return { ...msg, content: enhancedSystemPrompt };
            }
            return msg;
          });

          response = await openai.chat.completions.create({
            model,
            max_tokens: 4096,
            messages: messagesWithoutTools,
          });
          console.log("OpenAI API call successful (without tools)");
        } catch (retryError: any) {
          // If retry also fails, handle the original error
          console.error("Retry without tools also failed:", retryError);
          
          // Enhance error message with more context
          if (apiError.status === 401) {
            const enhancedError = new Error("Invalid API key. Please check your OPENAI_API_KEY environment variable.");
            enhancedError.name = apiError.name || "AuthenticationError";
            throw enhancedError;
          } else if (apiError.status === 429) {
            const enhancedError = new Error("Rate limit exceeded. Please wait a moment and try again.");
            enhancedError.name = apiError.name || "RateLimitError";
            throw enhancedError;
          } else if (apiError.status === 500 || apiError.status === 502 || apiError.status === 503) {
            const enhancedError = new Error("AI service is temporarily unavailable. Please try again in a moment.");
            enhancedError.name = apiError.name || "ServiceUnavailableError";
            throw enhancedError;
          } else if (apiError.code === "ECONNREFUSED" || apiError.code === "ENOTFOUND") {
            const enhancedError = new Error("Network error: Unable to connect to AI service. Please check your OPENAI_API_BASE_URL if using a custom endpoint.");
            enhancedError.name = apiError.name || "NetworkError";
            throw enhancedError;
          }
          
          throw apiError;
        }
      } else {
        // Enhance error message with more context for other errors
        if (apiError.status === 401) {
          const enhancedError = new Error("Invalid API key. Please check your OPENAI_API_KEY environment variable.");
          enhancedError.name = apiError.name || "AuthenticationError";
          throw enhancedError;
        } else if (apiError.status === 429) {
          const enhancedError = new Error("Rate limit exceeded. Please wait a moment and try again.");
          enhancedError.name = apiError.name || "RateLimitError";
          throw enhancedError;
        } else if (apiError.status === 500 || apiError.status === 502 || apiError.status === 503) {
          const enhancedError = new Error("AI service is temporarily unavailable. Please try again in a moment.");
          enhancedError.name = apiError.name || "ServiceUnavailableError";
          throw enhancedError;
        } else if (apiError.code === "ECONNREFUSED" || apiError.code === "ENOTFOUND") {
          const enhancedError = new Error("Network error: Unable to connect to AI service. Please check your OPENAI_API_BASE_URL if using a custom endpoint.");
          enhancedError.name = apiError.name || "NetworkError";
          throw enhancedError;
        }
        
        throw apiError;
      }
    }

    const executedTools: string[] = [];
    let finalText = "";

    // Handle tool calls if any (OpenAI format) - only if tools are supported
    if (toolsSupported && response.choices[0]?.message?.tool_calls) {
      const toolCalls = response.choices[0].message.tool_calls;
      console.log(`Processing ${toolCalls.length} tool calls`);

      // Add assistant's message to history
      messages.push(response.choices[0].message as OpenAI.Chat.Completions.ChatCompletionMessageParam);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue;
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`Executing function: ${functionName}`, functionArgs);
        executedTools.push(functionName);

        let functionResponse;
        try {
          // Try new agent tools first
          const newToolNames = agentTools.map(t => t.name);
          if (newToolNames.includes(functionName)) {
            functionResponse = await executeAgentTool(functionName, functionArgs, conversationId);
          } else {
            // Fall back to legacy tools
            switch (functionName) {
              case "create_email_template":
                functionResponse = await createEmailTemplate(functionArgs);
                break;
              case "get_company_profile":
                functionResponse = await getCompanyProfile();
                break;
              case "list_templates":
                functionResponse = await listTemplates();
                break;
              case "get_template":
                functionResponse = await getTemplate(functionArgs);
                break;
              case "get_booking_page_url":
                functionResponse = await getBookingPageUrl();
                break;
              default:
                functionResponse = { error: "Unknown function" };
            }
          }
        } catch (error) {
          console.error(`Error executing ${functionName}:`, error);
          functionResponse = {
            success: false,
            error: error instanceof Error ? error.message : "Function execution failed"
          };
        }

        // Add function result to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResponse),
        });
      }

      // Get final response from AI with function results
      const finalResponse = await openai.chat.completions.create({
        model,
        max_tokens: 4096,
        messages,
        tools: getAllTools(),
      });

      // Extract text from final response
      finalText = finalResponse.choices[0]?.message?.content || "";
    } else {
      // No tool use, extract text directly
      finalText = response.choices[0]?.message?.content || "";
    }

    console.log("✅ OpenAI API call successful!");
    const text = finalText;

    // Save conversation to database
    const newMessage = { role: "user", content: message, timestamp: new Date().toISOString() };
    const assistantMessage = { role: "assistant", content: text, timestamp: new Date().toISOString() };

    conversationMessages.push(newMessage, assistantMessage);

    let savedConversationId = conversationId;

    try {
      if (existingConversation) {
        // Update existing conversation
        await db.conversationHistory.update({
          where: { id: conversationId },
          data: {
            messages: conversationMessages,
            topics: [], // Could extract topics from conversation in the future
          },
        });
      } else {
        // Create new conversation
        const newConversation = await db.conversationHistory.create({
          data: {
            messages: conversationMessages,
            summary: null,
            topics: [],
          },
        });
        savedConversationId = newConversation.id;
      }
    } catch (saveError) {
      console.error("Error saving conversation:", saveError);
      // Continue even if save fails
    }

    console.log("Sending response to client");
    return NextResponse.json({
      response: text,
      clientDataIncluded: includeClientData,
      conversationId: savedConversationId,
      executedTools: executedTools.length > 0 ? executedTools : undefined,
    });
  } catch (error) {
    console.error("=== CHAT API ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : undefined);

    let errorMessage = "Failed to connect to AI service. Please try again.";
    let debugInfo = "";

    if (error instanceof Error) {
      debugInfo = error.message;
      
      // Provide more specific error messages based on error type
      if (error.message.includes("API key") || error.message.includes("authentication")) {
        errorMessage = "AI service authentication failed. Please check your API key configuration.";
      } else if (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Network error: Unable to reach AI service. Please check your internet connection and try again.";
      } else if (error.message.includes("timeout") || error.message.includes("TIMEOUT")) {
        errorMessage = "Request timed out. The AI service is taking too long to respond. Please try again.";
      } else if (error.message.includes("rate limit") || error.message.includes("429")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message.includes("model") || error.message.includes("invalid")) {
        errorMessage = "Invalid model configuration. Please check your AI service settings.";
      } else if (error.message.includes("OPENAI_API_KEY")) {
        errorMessage = "AI service not configured. Please set OPENAI_API_KEY in your environment variables.";
      } else {
        // Use the actual error message if it's informative
        errorMessage = error.message || errorMessage;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        debug: process.env.NODE_ENV === "development" ? debugInfo : undefined
      },
      { status: 500 }
    );
  }
}
