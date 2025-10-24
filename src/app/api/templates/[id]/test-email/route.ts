import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email";

export const dynamic = 'force-dynamic';

// POST - Send test email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Get template
    const template = await db.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Replace merge tags with sample data for test
    const sampleData: Record<string, string> = {
      "[First Name]": "John",
      "[Last Name]": "Doe",
      "[Company Name]": "Acme Corp",
      "[Email]": email,
      "[Phone]": "(555) 123-4567",
      "[Address]": "123 Main St, City, ST 12345",
      "[BOOKING_URL]": `${process.env.APP_URL || "http://localhost:3000"}/book`,
      "[UNSUBSCRIBE_LINK]": "#unsubscribe",
    };

    let bodyText = template.bodyText;
    let subject = template.subject;

    // Replace all merge tags
    Object.entries(sampleData).forEach(([tag, value]) => {
      bodyText = bodyText.replace(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      subject = subject.replace(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    // Send email
    await emailProvider.send({
      to: email,
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      fromName: process.env.EMAIL_FROM_NAME || "Your Company",
      subject: `[TEST] ${subject}`,
      html: `<pre style="font-family: system-ui, -apple-system, sans-serif; white-space: pre-wrap; word-wrap: break-word;">${bodyText}</pre>`,
      text: bodyText,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
