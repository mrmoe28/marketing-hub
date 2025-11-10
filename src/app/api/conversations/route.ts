import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET all conversations
export async function GET() {
  try {
    const conversations = await db.conversationHistory.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        summary: true,
        topics: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const conversation = await db.conversationHistory.create({
      data: {
        messages: data.messages || [],
        summary: data.summary || null,
        topics: data.topics || [],
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
