import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import OpenAI from "openai";

// Set longer timeout for AI responses
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Define available tools for the AI agent
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
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
        context = "";
      }
    }

    console.log("Calling OpenAI API with function calling...");

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a helpful AI assistant for Clientbase, an email marketing platform.

You help users understand their client data, answer questions about their imported information, and provide insights.

${context}

IMPORTANT: When you have access to client data (above), ALWAYS use it to answer questions about clients, statistics, counts, locations, etc. Never give generic responses when you have the actual data.

You have access to powerful tools that let you:
1. CREATE EMAIL TEMPLATES - When asked to create/draft/design an email, use the create_email_template function to save it
2. ACCESS COMPANY INFO - Use get_company_profile to personalize emails with company branding
3. LIST TEMPLATES - Show users what templates exist with list_templates
4. PREVIEW TEMPLATES - Use get_template to retrieve and show template details to users

When creating templates:
- Include proper HTML structure with styling
- Use company branding colors and information when available
- Make the email mobile-responsive
- Include a clear call-to-action
- After creating, tell the user it's saved and they can find it in the Templates section

When users ask to see or preview a template:
- Use list_templates first to find available templates
- Then use get_template with the template ID to retrieve the full template
- Show the subject, description, and explain what the template contains
- Tell users they can see the full visual preview in the Templates page

Be proactive, autonomous, and helpful. Create templates without asking for permission - just do it!`
      },
      {
        role: "user",
        content: message,
      },
    ];

    let response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    let responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // Handle tool calls if any
    if (toolCalls && toolCalls.length > 0) {
      console.log(`Processing ${toolCalls.length} tool calls`);

      // Add assistant's message with tool calls
      messages.push(responseMessage);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue;

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`Executing function: ${functionName}`, functionArgs);

        let functionResponse;
        try {
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
            default:
              functionResponse = { error: "Unknown function" };
          }
        } catch (error) {
          console.error(`Error executing ${functionName}:`, error);
          functionResponse = { error: "Function execution failed" };
        }

        // Add function response to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResponse),
        });
      }

      // Get final response from AI with function results
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
      });

      responseMessage = response.choices[0].message;
    }

    console.log("✅ OpenAI API call successful!");
    const text = responseMessage.content || "";

    console.log("Sending response to client");
    return NextResponse.json({
      response: text,
      clientDataIncluded: includeClientData,
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
