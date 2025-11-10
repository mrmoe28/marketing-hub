import { db } from "./db";
import type { Client, Campaign } from "@prisma/client";

export async function createJobsForAudience(campaignId: string, clientIds: string[]) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const clients = await db.client.findMany({
    where: {
      id: { in: clientIds },
      subscriptions: {
        some: {
          channel: "email",
          status: "subscribed",
        },
      },
    },
  });

  const jobs = await Promise.all(
    clients.map((client) =>
      db.emailJob.create({
        data: {
          campaignId: campaign.id,
          clientId: client.id,
          toEmail: client.email,
          status: "PENDING",
          scheduledAt: campaign.scheduledAt,
        },
      })
    )
  );

  return jobs;
}

export async function markOpen(token: string) {
  const job = await db.emailJob.findFirst({
    where: { openToken: token },
  });

  if (!job || job.openedAt) {
    return;
  }

  await db.emailJob.update({
    where: { id: job.id },
    data: { openedAt: new Date() },
  });

  await db.event.create({
    data: {
      type: "open",
      clientId: job.clientId,
      jobId: job.id,
    },
  });
}

export async function markClick(token: string, url: string) {
  const job = await db.emailJob.findFirst({
    where: { clickToken: token },
  });

  if (!job) {
    return;
  }

  if (!job.clickedAt) {
    await db.emailJob.update({
      where: { id: job.id },
      data: { clickedAt: new Date() },
    });
  }

  await db.event.create({
    data: {
      type: "click",
      clientId: job.clientId,
      jobId: job.id,
      meta: { url },
    },
  });
}

export async function markUnsub(token: string) {
  const job = await db.emailJob.findFirst({
    where: { unsubToken: token },
  });

  if (!job) {
    return null;
  }

  await db.emailJob.update({
    where: { id: job.id },
    data: { unsubAt: new Date() },
  });

  await db.subscription.updateMany({
    where: {
      clientId: job.clientId,
      channel: "email",
    },
    data: {
      status: "unsubscribed",
      updatedAt: new Date(),
    },
  });

  await db.event.create({
    data: {
      type: "unsubscribe",
      clientId: job.clientId,
      jobId: job.id,
    },
  });

  return job.clientId;
}
