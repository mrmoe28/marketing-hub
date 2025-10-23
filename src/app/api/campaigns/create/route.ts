import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createJobsForAudience } from "@/lib/tracking";

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  segmentId: z.string().optional(),
  clientIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateCampaignSchema.parse(body);

    const campaign = await db.campaign.create({
      data: {
        name: validated.name,
        subject: validated.subject || "Untitled Campaign",
        fromEmail: validated.fromEmail,
        fromName: validated.fromName || null,
        bodyHtml: validated.bodyHtml || "<p>Draft email...</p>",
        bodyText: validated.bodyText || "Draft email...",
        status: "DRAFT",
      },
    });

    let jobsCreated = 0;

    if (validated.clientIds && validated.clientIds.length > 0) {
      const jobs = await createJobsForAudience(campaign.id, validated.clientIds);
      jobsCreated = jobs.length;
    } else if (validated.segmentId) {
      const segment = await db.segment.findUnique({
        where: { id: validated.segmentId },
      });

      if (segment) {
        const clients = await db.client.findMany();
        const clientIds = clients.map((c) => c.id);

        const jobs = await createJobsForAudience(campaign.id, clientIds);
        jobsCreated = jobs.length;
      }
    }

    return NextResponse.json({
      campaign,
      jobsCreated,
    });
  } catch (error) {
    console.error("Campaign create error:", error);

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
      { error: error instanceof Error ? error.message : "Campaign create failed" },
      { status: 500 }
    );
  }
}
