import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email";
import { convertTextToHtml, wrapInEmailTemplate } from "@/lib/email-utils";
import { createJobsForAudience } from "@/lib/tracking";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Agent Tools Library
 * Provides the AI agent with capabilities to perform actions in the app
 */

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

/**
 * Log an activity performed by the AI agent
 */
async function logActivity(params: {
  conversationId?: string;
  toolName: string;
  toolInput: any;
  toolOutput?: any;
  status: "PENDING" | "SUCCESS" | "FAILED";
  error?: string;
  duration?: number;
}) {
  try {
    await db.agentActivity.create({
      data: {
        conversationId: params.conversationId || null,
        toolName: params.toolName,
        toolInput: params.toolInput,
        toolOutput: params.toolOutput || null,
        status: params.status,
        error: params.error || null,
        duration: params.duration || null,
      },
    });
  } catch (error) {
    // Don't let logging errors break the tool execution
    console.error("Failed to log activity:", error);
  }
}

// ============================================================================
// CAMPAIGN MANAGEMENT TOOLS
// ============================================================================

export async function createCampaign(params: {
  name: string;
  subject: string;
  bodyText: string;
  fromEmail: string;
  fromName?: string;
  clientIds?: string[];
  scheduledAt?: Date;
}) {
  try {
    const bodyHtml = wrapInEmailTemplate(convertTextToHtml(params.bodyText));

    const campaign = await db.campaign.create({
      data: {
        name: params.name,
        subject: params.subject,
        fromEmail: params.fromEmail,
        fromName: params.fromName || null,
        bodyHtml,
        bodyText: params.bodyText,
        status: params.scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: params.scheduledAt || null,
      },
    });

    // Create jobs for specified clients
    let jobsCreated = 0;
    if (params.clientIds && params.clientIds.length > 0) {
      const jobs = await createJobsForAudience(campaign.id, params.clientIds);
      jobsCreated = jobs.length;
    }

    return {
      success: true,
      campaign,
      jobsCreated,
      message: `Campaign "${params.name}" created successfully with ${jobsCreated} recipients`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create campaign",
    };
  }
}

export async function sendCampaign(campaignId: string) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: { jobs: true },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    });

    return {
      success: true,
      message: `Campaign "${campaign.name}" is now being sent to ${campaign.jobs.length} recipients`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send campaign",
    };
  }
}

export async function getCampaignStats(campaignId: string) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: { jobs: true },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    const totalJobs = campaign.jobs.length;
    const sent = campaign.jobs.filter((j) => j.status === "SENT").length;
    const opened = campaign.jobs.filter((j) => j.openedAt !== null).length;
    const clicked = campaign.jobs.filter((j) => j.clickedAt !== null).length;
    const failed = campaign.jobs.filter((j) => j.status === "FAILED").length;

    const openRate = totalJobs > 0 ? ((opened / sent) * 100).toFixed(2) : "0.00";
    const clickRate = totalJobs > 0 ? ((clicked / sent) * 100).toFixed(2) : "0.00";

    return {
      success: true,
      stats: {
        name: campaign.name,
        status: campaign.status,
        totalRecipients: totalJobs,
        sent,
        opened,
        clicked,
        failed,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get campaign stats",
    };
  }
}

// ============================================================================
// TEMPLATE MANAGEMENT TOOLS
// ============================================================================

export async function createEmailTemplate(params: {
  name: string;
  subject: string;
  bodyText: string;
  category?: string;
  description?: string;
}) {
  try {
    const bodyHtml = wrapInEmailTemplate(convertTextToHtml(params.bodyText));

    const template = await db.emailTemplate.create({
      data: {
        name: params.name,
        subject: params.subject,
        bodyHtml,
        bodyText: params.bodyText,
        category: params.category || null,
        description: params.description || null,
        isAiCreated: true,
      },
    });

    return {
      success: true,
      template,
      message: `Template "${params.name}" created successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create template",
    };
  }
}

export async function updateEmailTemplate(
  templateId: string,
  updates: {
    name?: string;
    subject?: string;
    bodyText?: string;
    category?: string;
    description?: string;
  }
) {
  try {
    const updateData: any = { ...updates };

    if (updates.bodyText) {
      updateData.bodyHtml = wrapInEmailTemplate(convertTextToHtml(updates.bodyText));
    }

    const template = await db.emailTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    return {
      success: true,
      template,
      message: `Template "${template.name}" updated successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update template",
    };
  }
}

export async function sendTestEmail(params: {
  templateId: string;
  toEmail: string;
}) {
  try {
    const template = await db.emailTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Sample data for merge tags
    const sampleData: Record<string, string> = {
      "[First Name]": "John",
      "[Last Name]": "Doe",
      "[Company Name]": "Acme Corp",
      "[Email]": params.toEmail,
      "[Phone]": "(555) 123-4567",
      "[Address]": "123 Main St, City, ST 12345",
      "[BOOKING_URL]": `${process.env.APP_URL || "http://localhost:3000"}/book`,
      "[UNSUBSCRIBE_LINK]": "#unsubscribe",
    };

    let bodyText = template.bodyText;
    let subject = template.subject;

    Object.entries(sampleData).forEach(([tag, value]) => {
      const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      bodyText = bodyText.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    const htmlBody = wrapInEmailTemplate(convertTextToHtml(bodyText));

    await emailProvider.send({
      to: params.toEmail,
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      fromName: process.env.EMAIL_FROM_NAME || "Marketing Hub Test",
      subject: `[TEST] ${subject}`,
      html: htmlBody,
      text: bodyText,
    });

    return {
      success: true,
      message: `Test email sent to ${params.toEmail}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send test email",
    };
  }
}

export async function listTemplates(category?: string) {
  try {
    const templates = await db.emailTemplate.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        subject: true,
        category: true,
        description: true,
        isAiCreated: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      templates,
      count: templates.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list templates",
    };
  }
}

// ============================================================================
// CLIENT MANAGEMENT TOOLS
// ============================================================================

export async function searchClients(params: {
  query?: string;
  state?: string;
  city?: string;
  tags?: string[];
  limit?: number;
}) {
  try {
    const where: any = {};

    if (params.query) {
      where.OR = [
        { email: { contains: params.query, mode: "insensitive" } },
        { firstName: { contains: params.query, mode: "insensitive" } },
        { lastName: { contains: params.query, mode: "insensitive" } },
        { company: { contains: params.query, mode: "insensitive" } },
      ];
    }

    if (params.state) {
      where.state = params.state;
    }

    if (params.city) {
      where.city = { contains: params.city, mode: "insensitive" };
    }

    const clients = await db.client.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: params.limit || 50,
      orderBy: { createdAt: "desc" },
    });

    // Filter by tags if specified
    let filteredClients = clients;
    if (params.tags && params.tags.length > 0) {
      filteredClients = clients.filter((client) =>
        params.tags!.some((tagName) =>
          client.tags.some((t) => t.tag.name === tagName)
        )
      );
    }

    return {
      success: true,
      clients: filteredClients.map((c) => ({
        id: c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        company: c.company,
        phone: c.phone,
        city: c.city,
        state: c.state,
        tags: c.tags.map((t) => t.tag.name),
      })),
      count: filteredClients.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search clients",
    };
  }
}

export async function addClient(params: {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  tags?: string[];
}) {
  try {
    const client = await db.client.create({
      data: {
        email: params.email,
        firstName: params.firstName || null,
        lastName: params.lastName || null,
        company: params.company || null,
        phone: params.phone || null,
        address1: params.address1 || null,
        city: params.city || null,
        state: params.state || null,
        postalCode: params.postalCode || null,
      },
    });

    // Add tags if specified
    if (params.tags && params.tags.length > 0) {
      for (const tagName of params.tags) {
        const tag = await db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await db.tagOnClient.create({
          data: {
            clientId: client.id,
            tagId: tag.id,
          },
        });
      }
    }

    return {
      success: true,
      client,
      message: `Client ${params.email} added successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add client",
    };
  }
}

export async function tagClients(clientIds: string[], tagNames: string[]) {
  try {
    let tagged = 0;

    for (const clientId of clientIds) {
      for (const tagName of tagNames) {
        const tag = await db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await db.tagOnClient.upsert({
          where: {
            clientId_tagId: {
              clientId,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            clientId,
            tagId: tag.id,
          },
        });

        tagged++;
      }
    }

    return {
      success: true,
      message: `Tagged ${clientIds.length} clients with ${tagNames.length} tags (${tagged} total tags applied)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to tag clients",
    };
  }
}

export async function getClientStats() {
  try {
    const totalClients = await db.client.count();
    const clientsByState = await db.client.groupBy({
      by: ["state"],
      _count: true,
      orderBy: {
        _count: {
          state: "desc",
        },
      },
      take: 10,
    });

    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: { clients: true },
        },
      },
      orderBy: {
        clients: {
          _count: "desc",
        },
      },
      take: 10,
    });

    return {
      success: true,
      stats: {
        totalClients,
        topStates: clientsByState.map((s) => ({
          state: s.state || "Unknown",
          count: s._count,
        })),
        topTags: tags.map((t) => ({
          name: t.name,
          clientCount: t._count.clients,
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get client stats",
    };
  }
}

// ============================================================================
// BOOKING MANAGEMENT TOOLS
// ============================================================================

export async function createBooking(params: {
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  serviceType: string;
  scheduledDate: Date;
  duration?: number;
  notes?: string;
}) {
  try {
    // Try to find existing client
    const client = await db.client.findUnique({
      where: { email: params.clientEmail },
    });

    const booking = await db.booking.create({
      data: {
        clientId: client?.id || null,
        clientEmail: params.clientEmail,
        clientName: params.clientName,
        clientPhone: params.clientPhone || null,
        serviceType: params.serviceType,
        scheduledDate: params.scheduledDate,
        duration: params.duration || 60,
        status: "PENDING",
        notes: params.notes || null,
      },
    });

    return {
      success: true,
      booking,
      message: `Booking created for ${params.clientName} on ${params.scheduledDate.toLocaleString()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create booking",
    };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
) {
  try {
    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status,
        confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
        cancelledAt: status === "CANCELLED" ? new Date() : undefined,
      },
    });

    return {
      success: true,
      booking,
      message: `Booking status updated to ${status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update booking",
    };
  }
}

export async function listBookings(params?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  try {
    const where: any = {};

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.startDate || params?.endDate) {
      where.scheduledDate = {};
      if (params.startDate) where.scheduledDate.gte = params.startDate;
      if (params.endDate) where.scheduledDate.lte = params.endDate;
    }

    const bookings = await db.booking.findMany({
      where,
      orderBy: { scheduledDate: "asc" },
      take: params?.limit || 50,
    });

    return {
      success: true,
      bookings,
      count: bookings.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list bookings",
    };
  }
}

// ============================================================================
// CLIENT FILE SYSTEM TOOLS (Performance optimization)
// ============================================================================

/**
 * Get clients from the file system cache organized by state
 * This is much faster than database queries for large datasets
 */
export async function getClientsFromState(params: {
  state: string;
}) {
  try {
    const stateNormalized = params.state.toUpperCase();
    const filePath = join(process.cwd(), "data", "clients", `${stateNormalized.toLowerCase()}.json`);

    try {
      const fileContent = readFileSync(filePath, "utf-8");
      const clients = JSON.parse(fileContent);

      return {
        success: true,
        clients,
        count: clients.length,
        state: stateNormalized,
      };
    } catch (fileError) {
      // File not found or invalid - state might not have clients
      return {
        success: true,
        clients: [],
        count: 0,
        state: stateNormalized,
        message: `No clients found for state ${stateNormalized}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get clients from state",
    };
  }
}

/**
 * Get available states from the index
 */
export async function getAvailableStates() {
  try {
    const indexPath = join(process.cwd(), "data", "clients", "index.json");

    try {
      const fileContent = readFileSync(indexPath, "utf-8");
      const index = JSON.parse(fileContent);

      return {
        success: true,
        states: index.states,
        totalClients: index.totalClients,
        lastUpdated: index.lastUpdated,
      };
    } catch (fileError) {
      return {
        success: false,
        error: "Client data not yet exported. Run 'npx tsx scripts/export-clients.ts' to generate client files.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get available states",
    };
  }
}

// ============================================================================
// TOOL DEFINITIONS FOR CLAUDE
// ============================================================================

export const agentTools = [
  {
    name: "createCampaign",
    description: "Create a new email campaign. Can be draft or scheduled. Specify clientIds to add recipients.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Campaign name" },
        subject: { type: "string", description: "Email subject line" },
        bodyText: { type: "string", description: "Plain text email body (can include merge tags like [First Name])" },
        fromEmail: { type: "string", description: "Sender email address" },
        fromName: { type: "string", description: "Sender name (optional)" },
        clientIds: { type: "array", items: { type: "string" }, description: "Array of client IDs to send to (optional)" },
        scheduledAt: { type: "string", description: "ISO date string for scheduling (optional)" },
      },
      required: ["name", "subject", "bodyText", "fromEmail"],
    },
  },
  {
    name: "sendCampaign",
    description: "Start sending a campaign immediately",
    input_schema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID to send" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "getCampaignStats",
    description: "Get performance statistics for a campaign including open rates, click rates, etc",
    input_schema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "createEmailTemplate",
    description: "Create a new email template that can be reused for campaigns",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Template name" },
        subject: { type: "string", description: "Email subject line (can include merge tags)" },
        bodyText: { type: "string", description: "Plain text email body (can include merge tags)" },
        category: { type: "string", description: "Template category like 'welcome', 'promotion', 'follow-up' (optional)" },
        description: { type: "string", description: "Template description (optional)" },
      },
      required: ["name", "subject", "bodyText"],
    },
  },
  {
    name: "updateEmailTemplate",
    description: "Update an existing email template",
    input_schema: {
      type: "object",
      properties: {
        templateId: { type: "string", description: "Template ID" },
        name: { type: "string", description: "New name (optional)" },
        subject: { type: "string", description: "New subject (optional)" },
        bodyText: { type: "string", description: "New body text (optional)" },
        category: { type: "string", description: "New category (optional)" },
        description: { type: "string", description: "New description (optional)" },
      },
      required: ["templateId"],
    },
  },
  {
    name: "sendTestEmail",
    description: "Send a test email using a template with sample data",
    input_schema: {
      type: "object",
      properties: {
        templateId: { type: "string", description: "Template ID" },
        toEmail: { type: "string", description: "Recipient email address" },
      },
      required: ["templateId", "toEmail"],
    },
  },
  {
    name: "listTemplates",
    description: "List all email templates, optionally filtered by category",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category (optional)" },
      },
    },
  },
  {
    name: "searchClients",
    description: "Search for clients by various criteria including location, tags, and text search",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text (searches email, name, company) (optional)" },
        state: { type: "string", description: "Filter by state (optional)" },
        city: { type: "string", description: "Filter by city (optional)" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by tags (optional)" },
        limit: { type: "number", description: "Maximum results to return (default 50) (optional)" },
      },
    },
  },
  {
    name: "addClient",
    description: "Add a new client to the database",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Client email address" },
        firstName: { type: "string", description: "First name (optional)" },
        lastName: { type: "string", description: "Last name (optional)" },
        company: { type: "string", description: "Company name (optional)" },
        phone: { type: "string", description: "Phone number (optional)" },
        address1: { type: "string", description: "Street address (optional)" },
        city: { type: "string", description: "City (optional)" },
        state: { type: "string", description: "State (optional)" },
        postalCode: { type: "string", description: "Postal/ZIP code (optional)" },
        tags: { type: "array", items: { type: "string" }, description: "Tags to apply (optional)" },
      },
      required: ["email"],
    },
  },
  {
    name: "tagClients",
    description: "Add tags to multiple clients at once",
    input_schema: {
      type: "object",
      properties: {
        clientIds: { type: "array", items: { type: "string" }, description: "Array of client IDs" },
        tagNames: { type: "array", items: { type: "string" }, description: "Array of tag names to add" },
      },
      required: ["clientIds", "tagNames"],
    },
  },
  {
    name: "getClientStats",
    description: "Get statistics about clients including total count, distribution by state, and popular tags",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "getClientsFromState",
    description: "Get all clients from a specific US state from the file system cache. This is MUCH faster than database queries and should be preferred for client lookups.",
    input_schema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter US state code (e.g., 'GA', 'SC', 'NY')" },
      },
      required: ["state"],
    },
  },
  {
    name: "getAvailableStates",
    description: "Get a list of all states that have clients, with client counts and metadata. Use this to discover which states have data before calling getClientsFromState.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "createBooking",
    description: "Create a new booking/appointment for a client",
    input_schema: {
      type: "object",
      properties: {
        clientEmail: { type: "string", description: "Client email address" },
        clientName: { type: "string", description: "Client full name" },
        clientPhone: { type: "string", description: "Client phone number (optional)" },
        serviceType: { type: "string", description: "Type of service/appointment" },
        scheduledDate: { type: "string", description: "ISO date string for appointment time" },
        duration: { type: "number", description: "Duration in minutes (default 60) (optional)" },
        notes: { type: "string", description: "Client notes or special requests (optional)" },
      },
      required: ["clientEmail", "clientName", "serviceType", "scheduledDate"],
    },
  },
  {
    name: "updateBookingStatus",
    description: "Update the status of a booking",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "string", description: "Booking ID" },
        status: {
          type: "string",
          enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
          description: "New status",
        },
      },
      required: ["bookingId", "status"],
    },
  },
  {
    name: "listBookings",
    description: "List bookings with optional filters",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status (optional)" },
        startDate: { type: "string", description: "Filter by start date (ISO string) (optional)" },
        endDate: { type: "string", description: "Filter by end date (ISO string) (optional)" },
        limit: { type: "number", description: "Maximum results (default 50) (optional)" },
      },
    },
  },
];

// Tool execution router with activity logging
export async function executeAgentTool(
  toolName: string,
  toolInput: any,
  conversationId?: string
) {
  const startTime = Date.now();
  let result: any;
  let status: "SUCCESS" | "FAILED" = "SUCCESS";
  let error: string | undefined;

  try {
    switch (toolName) {
      case "createCampaign":
        result = await createCampaign(toolInput);
        break;
      case "sendCampaign":
        result = await sendCampaign(toolInput.campaignId);
        break;
      case "getCampaignStats":
        result = await getCampaignStats(toolInput.campaignId);
        break;
      case "createEmailTemplate":
        result = await createEmailTemplate(toolInput);
        break;
      case "updateEmailTemplate":
        result = await updateEmailTemplate(toolInput.templateId, toolInput);
        break;
      case "sendTestEmail":
        result = await sendTestEmail(toolInput);
        break;
      case "listTemplates":
        result = await listTemplates(toolInput.category);
        break;
      case "searchClients":
        result = await searchClients(toolInput);
        break;
      case "addClient":
        result = await addClient(toolInput);
        break;
      case "tagClients":
        result = await tagClients(toolInput.clientIds, toolInput.tagNames);
        break;
      case "getClientStats":
        result = await getClientStats();
        break;
      case "getClientsFromState":
        result = await getClientsFromState(toolInput);
        break;
      case "getAvailableStates":
        result = await getAvailableStates();
        break;
      case "createBooking":
        result = await createBooking({
          ...toolInput,
          scheduledDate: new Date(toolInput.scheduledDate),
        });
        break;
      case "updateBookingStatus":
        result = await updateBookingStatus(toolInput.bookingId, toolInput.status);
        break;
      case "listBookings":
        result = await listBookings({
          ...toolInput,
          startDate: toolInput.startDate ? new Date(toolInput.startDate) : undefined,
          endDate: toolInput.endDate ? new Date(toolInput.endDate) : undefined,
        });
        break;
      default:
        result = {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
        status = "FAILED";
        error = `Unknown tool: ${toolName}`;
    }

    // Check if result indicates failure
    if (result && result.success === false) {
      status = "FAILED";
      error = result.error || "Tool execution failed";
    }
  } catch (err) {
    status = "FAILED";
    error = err instanceof Error ? err.message : String(err);
    result = {
      success: false,
      error,
    };
  }

  const duration = Date.now() - startTime;

  // Log the activity
  await logActivity({
    conversationId,
    toolName,
    toolInput,
    toolOutput: result,
    status,
    error,
    duration,
  });

  return result;
}
