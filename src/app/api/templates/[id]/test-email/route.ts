import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email";
import { convertTextToHtml, wrapInEmailTemplate } from "@/lib/email-utils";

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

    // Convert plain text to HTML with clickable links
    const htmlBody = wrapInEmailTemplate(convertTextToHtml(bodyText));

    // Get sender email - use Resend's test domain if EMAIL_FROM not set
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const fromName = process.env.EMAIL_FROM_NAME || "Marketing Hub Test";

    console.log(`Sending test email to ${email} from ${fromEmail}`);

    // Send email
    try {
      await emailProvider.send({
        to: email,
        from: fromEmail,
        fromName: fromName,
        subject: `[TEST] ${subject}`,
        html: htmlBody,
        text: bodyText,
      });

      console.log(`Test email sent successfully to ${email}`);
    } catch (sendError) {
      console.error("Email send error:", sendError);
      throw new Error(`Email delivery failed: ${sendError instanceof Error ? sendError.message : "Unknown error"}. Check your Resend API key and domain verification.`);
    }

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
