import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCSV } from "@/lib/csv";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { data, errors } = await parseCSV(file);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV parsing errors",
          details: errors,
        },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;
    const tagCounts: Record<string, number> = {};

    for (const row of data) {
      const tags = row.tags
        ? row.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const existingClient = await db.client.findUnique({
        where: { email: row.email },
      });

      const clientData = {
        email: row.email,
        firstName: row.firstName || null,
        lastName: row.lastName || null,
        company: row.company || null,
        phone: row.phone || null,
        address1: row.address1 || null,
        address2: row.address2 || null,
        city: row.city || null,
        state: row.state || null,
        postalCode: row.postalCode || null,
        country: row.country || null,
      };

      let client;
      if (existingClient) {
        client = await db.client.update({
          where: { id: existingClient.id },
          data: clientData,
        });
        updated++;
      } else {
        client = await db.client.create({
          data: {
            ...clientData,
            filesPrefix: `clients/${Date.now()}-${row.email}/`,
          },
        });
        created++;

        await db.subscription.create({
          data: {
            clientId: client.id,
            channel: "email",
            status: "subscribed",
          },
        });
      }

      for (const tagName of tags) {
        const tag = await db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await db.tagOnClient.upsert({
          where: {
            clientId_tagId: {
              clientId: client.id,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            clientId: client.id,
            tagId: tag.id,
          },
        });

        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      total: created + updated,
      tagCounts,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
