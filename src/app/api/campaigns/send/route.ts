import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { emailProvider, buildTracking } from "@/lib/email";

const SendCampaignSchema = z.object({
  campaignId: z.string(),
  when: z.union([z.literal("now"), z.string().datetime()]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SendCampaignSchema.parse(body);

    const campaign = await db.campaign.findUnique({
      where: { id: validated.campaignId },
      include: {
        jobs: {
          where: {
            status: "PENDING",
          },
          take: 50,
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (validated.when && validated.when !== "now") {
      await db.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "SCHEDULED",
          scheduledAt: new Date(validated.when),
        },
      });

      await db.emailJob.updateMany({
        where: { campaignId: campaign.id },
        data: { scheduledAt: new Date(validated.when) },
      });

      return NextResponse.json({
        campaign,
        status: "scheduled",
        scheduledAt: validated.when,
      });
    }

    await db.campaign.update({
      where: { id: campaign.id },
      data: { status: "SENDING" },
    });

    let sent = 0;
    let failed = 0;
    let suppressed = 0;

    for (const job of campaign.jobs) {
      try {
        const subscription = await db.subscription.findFirst({
          where: {
            clientId: job.clientId,
            channel: "email",
          },
        });

        if (subscription?.status !== "subscribed") {
          await db.emailJob.update({
            where: { id: job.id },
            data: { status: "SUPPRESSED" },
          });
          suppressed++;
          continue;
        }

        await db.emailJob.update({
          where: { id: job.id },
          data: { status: "SENDING" },
        });

        const { html, text } = buildTracking(job, campaign.bodyHtml, campaign.bodyText);

        await emailProvider.send({
          to: job.toEmail,
          from: campaign.fromEmail,
          fromName: campaign.fromName || undefined,
          subject: campaign.subject,
          html,
          text,
        });

        await db.emailJob.update({
          where: { id: job.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });

        sent++;
      } catch (error) {
        await db.emailJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        failed++;
      }
    }

    const remainingJobs = await db.emailJob.count({
      where: {
        campaignId: campaign.id,
        status: "PENDING",
      },
    });

    if (remainingJobs === 0) {
      await db.campaign.update({
        where: { id: campaign.id },
        data: { status: "SENT" },
      });
    }

    return NextResponse.json({
      campaign,
      sent,
      failed,
      suppressed,
      remainingJobs,
    });
  } catch (error) {
    console.error("Campaign send error:", error);

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
      { error: error instanceof Error ? error.message : "Campaign send failed" },
      { status: 500 }
    );
  }
}
