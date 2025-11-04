import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { agentTools, executeAgentTool } from "@/lib/agent-tools";

// Set longer timeout for AI responses
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Convert agent tools to Anthropic format
const convertToolsToAnthropicFormat = (): Anthropic.Tool[] => {
  return agentTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      ...tool.input_schema,
      type: "object" as const,
    },
  }));
};

// Legacy tools for backwards compatibility (Anthropic format)
const legacyTools: Anthropic.Tool[] = [
  {
    name: "create_email_template",
    description: "Create and save a new email template. Use this when the user asks you to create, draft, or design an email template.",
    input_schema: {
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
  },
  {
    name: "get_company_profile",
    description: "Get the company profile information including name, logo, branding, and contact details. Use this to personalize email templates.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "list_templates",
    description: "Get a list of all saved email templates",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_template",
    description: "Get full details of a specific template by ID, including the HTML body for preview. Use this when the user wants to see or preview a template.",
    input_schema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          description: "The ID of the template to retrieve"
        }
      },
      required: ["templateId"]
    }
  },
  {
    name: "get_booking_page_url",
    description: "Get the public booking page URL where customers can schedule appointments. Use this when users ask about booking, scheduling, or appointments.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
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
  return [...legacyTools, ...convertToolsToAnthropicFormat()];
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("API key status:", apiKey ? `Present (${apiKey.substring(0, 10)}...)` : "Missing");

    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 500 }
      );
    }

    console.log("Initializing Anthropic client...");
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    let context = "";
    console.log("Building context, includeClientData:", includeClientData);

    // Optionally include client data summary
    if (includeClientData) {
      try {
        console.log("Fetching client data...");
        const clients = await db.client.findMany({
          take: 50,
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
        const clientSummaries = clients.slice(0, 10).map((c, i) => {
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

    console.log("Calling Anthropic API with function calling...");
    console.log("Context length:", context.length);
    console.log("Context preview:", context.substring(0, 200));

    // Build system message for Anthropic (separate from messages)
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

    // Build messages array for Anthropic (no system message in array)
    const messages: Anthropic.MessageParam[] = [];

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

    console.log("About to call Anthropic API");
    console.log("Messages count:", messages.length);
    console.log("System prompt length:", systemPrompt.length);
    console.log("Tools count:", getAllTools().length);

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
        tools: getAllTools(),
      });
      console.log("Anthropic API call successful");
    } catch (apiError: any) {
      console.error("Anthropic API error details:", {
        message: apiError.message,
        status: apiError.status,
        type: apiError.type,
        error: apiError.error
      });
      throw apiError;
    }

    const executedTools: string[] = [];
    let finalText = "";

    // Handle tool calls if any (Anthropic format)
    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      console.log(`Processing ${toolUseBlocks.length} tool calls`);

      // Add assistant's message to history
      messages.push({
        role: "assistant",
        content: response.content,
      });

      // Build tool results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      // Execute each tool call
      for (const toolUse of toolUseBlocks) {
        const functionName = toolUse.name;
        const functionArgs = toolUse.input as any;

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

        // Anthropic expects string content, ensure proper formatting
        const resultContent = typeof functionResponse === 'string'
          ? functionResponse
          : JSON.stringify(functionResponse, null, 2);

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: resultContent,
        });
      }

      // Add tool results to messages
      messages.push({
        role: "user",
        content: toolResults,
      });

      // Get final response from AI with function results
      const finalResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
        tools: getAllTools(),
      });

      // Extract text from final response
      const textBlocks = finalResponse.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      finalText = textBlocks.map(block => block.text).join("\n");
    } else {
      // No tool use, extract text directly
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      finalText = textBlocks.map(block => block.text).join("\n");
    }

    console.log("✅ Anthropic API call successful!");
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

    let errorMessage = "Failed to connect to AI service. Please try again.";
    let debugInfo = "";

    if (error instanceof Error) {
      debugInfo = error.message;
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
