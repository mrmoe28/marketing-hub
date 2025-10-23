import { NextRequest, NextResponse } from "next/server";
import { markUnsub } from "@/lib/tracking";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const clientId = await markUnsub(token);

  if (!clientId) {
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head><title>Unsubscribe</title></head>
<body style="font-family: system-ui; max-width: 600px; margin: 100px auto; text-align: center;">
  <h1>Invalid Link</h1>
  <p>This unsubscribe link is not valid.</p>
</body>
</html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><title>Unsubscribed</title></head>
<body style="font-family: system-ui; max-width: 600px; margin: 100px auto; text-align: center;">
  <h1>✓ You're Unsubscribed</h1>
  <p>You won't receive any more emails from us.</p>
  <p style="color: #666; font-size: 14px; margin-top: 40px;">If this was a mistake, contact us to resubscribe.</p>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}
