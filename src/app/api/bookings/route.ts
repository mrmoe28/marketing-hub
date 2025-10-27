import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email";
import { wrapInEmailTemplate } from "@/lib/email-utils";

export const dynamic = 'force-dynamic';

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Try to find existing client by email
    let clientId = data.clientId;
    if (!clientId && data.clientEmail) {
      const existingClient = await db.client.findUnique({
        where: { email: data.clientEmail },
      });
      clientId = existingClient?.id;
    }

    const booking = await db.booking.create({
      data: {
        clientId: clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        serviceType: data.serviceType,
        scheduledDate: new Date(data.scheduledDate),
        duration: data.duration || 60,
        timezone: data.timezone || "America/New_York",
        notes: data.notes,
        status: data.status || "PENDING",
      },
      include: {
        client: true,
      },
    });

    // Send email notification to admin
    try {
      // Get admin email from company profile
      const companyProfile = await db.companyProfile.findFirst();
      const adminEmail = companyProfile?.contactEmail || process.env.EMAIL_FROM || "onboarding@resend.dev";

      // Format booking date
      const bookingDate = new Date(booking.scheduledDate);
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
        timeZone: booking.timezone
      };
      const formattedDate = bookingDate.toLocaleString('en-US', dateOptions);

      // Create email content
      const emailHtml = `
        <h2>New Booking Request</h2>
        <p>You have received a new booking request with the following details:</p>

        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; width: 180px;">Client Name:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${booking.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${booking.clientEmail}">${booking.clientEmail}</a></td>
          </tr>
          ${booking.clientPhone ? `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Phone:</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${booking.clientPhone}">${booking.clientPhone}</a></td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Service Type:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${booking.serviceType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Scheduled Date:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Duration:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${booking.duration} minutes</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Status:</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><span style="padding: 4px 8px; background-color: #fef3c7; color: #92400e; border-radius: 4px; font-weight: 500;">${booking.status}</span></td>
          </tr>
          ${booking.notes ? `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; vertical-align: top;">Notes:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${booking.notes}</td>
          </tr>
          ` : ''}
        </table>

        <p style="margin-top: 20px;">
          <a href="${process.env.APP_URL || 'http://localhost:3002'}/bookings"
             style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View in Dashboard
          </a>
        </p>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This booking request was submitted through your booking page and requires confirmation.
        </p>
      `;

      const emailText = `
New Booking Request

You have received a new booking request:

Client Name: ${booking.clientName}
Email: ${booking.clientEmail}
${booking.clientPhone ? `Phone: ${booking.clientPhone}\n` : ''}Service Type: ${booking.serviceType}
Scheduled Date: ${formattedDate}
Duration: ${booking.duration} minutes
Status: ${booking.status}
${booking.notes ? `\nNotes: ${booking.notes}` : ''}

View in Dashboard: ${process.env.APP_URL || 'http://localhost:3002'}/bookings
      `;

      // Send notification email
      await emailProvider.send({
        to: adminEmail,
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        fromName: process.env.EMAIL_FROM_NAME || "Marketing Hub",
        subject: `New Booking: ${booking.clientName} - ${booking.serviceType}`,
        html: wrapInEmailTemplate(emailHtml),
        text: emailText,
      });

      console.log(`Booking notification email sent to ${adminEmail}`);
    } catch (emailError) {
      // Log error but don't fail the booking creation
      console.error("Failed to send booking notification email:", emailError);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
