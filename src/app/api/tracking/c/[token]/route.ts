import { NextRequest, NextResponse } from "next/server";
import { markClick } from "@/lib/tracking";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("u");

  if (!url) {
    return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
  }

  await markClick(token, url);

  return NextResponse.redirect(url);
}
