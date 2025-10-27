import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email";
import { wrapInEmailTemplate } from "@/lib/email-utils";
import { google } from "googleapis";

export const dynamic = 'force-dynamic';

// GET single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await db.booking.findUnique({
      where: { id },
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
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData: any = {};

    if (data.clientName) updateData.clientName = data.clientName;
    if (data.clientEmail) updateData.clientEmail = data.clientEmail;
    if (data.clientPhone !== undefined) updateData.clientPhone = data.clientPhone;
    if (data.serviceType) updateData.serviceType = data.serviceType;
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.duration) updateData.duration = data.duration;
    if (data.timezone) updateData.timezone = data.timezone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
    if (data.status) {
      updateData.status = data.status;

      // Track confirmation and cancellation
      if (data.status === 'CONFIRMED' && !data.confirmedAt) {
        updateData.confirmedAt = new Date();
      }
      if (data.status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        if (data.cancellationReason) {
          updateData.cancellationReason = data.cancellationReason;
        }
      }
    }

    // Get the old booking first to check if status changed
    const oldBooking = await db.booking.findUnique({ where: { id } });
    const wasJustConfirmed = data.status === 'CONFIRMED' && oldBooking?.status !== 'CONFIRMED';

    const booking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
      },
    });

    // If booking was just confirmed, send confirmation email and create calendar event
    if (wasJustConfirmed) {
      // Send confirmation email to customer
      try {
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

        const companyProfile = await db.companyProfile.findFirst();
        const companyName = companyProfile?.companyName || "Our Team";

        const emailHtml = `
          <h2>Booking Confirmed! 🎉</h2>
          <p>Hi ${booking.clientName.split(' ')[0]},</p>
          <p>Great news! Your appointment has been confirmed.</p>

          <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0; border: 2px solid #2563eb;">
            <tr>
              <td colspan="2" style="padding: 15px; background-color: #2563eb; color: white; font-size: 18px; font-weight: bold; text-align: center;">
                Appointment Details
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; width: 180px;">Service:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${booking.serviceType}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Date & Time:</td>
              <td style="padding: 12px; border: 1px solid #ddd;"><strong>${formattedDate}</strong></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Duration:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${booking.duration} minutes</td>
            </tr>
            ${booking.notes ? `
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; vertical-align: top;">Notes:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${booking.notes}</td>
            </tr>
            ` : ''}
          </table>

          <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #1e40af;">📅 Add to Calendar</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
              Save this appointment to your calendar so you don't forget!
            </p>
          </div>

          ${companyProfile?.contactPhone || companyProfile?.contactEmail ? `
          <p style="margin-top: 20px;">
            If you need to reschedule or have any questions, please contact us:
          </p>
          <ul style="list-style: none; padding: 0;">
            ${companyProfile?.contactEmail ? `<li>📧 ${companyProfile.contactEmail}</li>` : ''}
            ${companyProfile?.contactPhone ? `<li>📞 ${companyProfile.contactPhone}</li>` : ''}
          </ul>
          ` : ''}

          <p style="margin-top: 30px;">We look forward to seeing you!</p>
          <p style="font-weight: 500;">— ${companyName}</p>

          <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            Booking ID: ${booking.id}
          </p>
        `;

        const emailText = `
Booking Confirmed!

Hi ${booking.clientName.split(' ')[0]},

Great news! Your appointment has been confirmed.

APPOINTMENT DETAILS
-------------------
Service: ${booking.serviceType}
Date & Time: ${formattedDate}
Duration: ${booking.duration} minutes
${booking.notes ? `\nNotes: ${booking.notes}` : ''}

${companyProfile?.contactPhone || companyProfile?.contactEmail ? `
If you need to reschedule or have any questions, please contact us:
${companyProfile?.contactEmail ? `Email: ${companyProfile.contactEmail}` : ''}
${companyProfile?.contactPhone ? `Phone: ${companyProfile.contactPhone}` : ''}
` : ''}

We look forward to seeing you!

— ${companyName}

Booking ID: ${booking.id}
        `;

        await emailProvider.send({
          to: booking.clientEmail,
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          fromName: companyProfile?.companyName || process.env.EMAIL_FROM_NAME || "Marketing Hub",
          subject: `Appointment Confirmed: ${booking.serviceType}`,
          html: wrapInEmailTemplate(emailHtml),
          text: emailText,
        });

        console.log(`Confirmation email sent to ${booking.clientEmail}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      // Create Google Calendar event
      try {
        const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

        if (credentials) {
          const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(credentials),
            scopes: ['https://www.googleapis.com/auth/calendar'],
          });

          const calendar = google.calendar({ version: 'v3', auth });

          const startDate = new Date(booking.scheduledDate);
          const endDate = new Date(startDate.getTime() + booking.duration * 60000);

          const companyProfile = await db.companyProfile.findFirst();

          const event = {
            summary: `${booking.serviceType} - ${booking.clientName}`,
            description: `
Client: ${booking.clientName}
Email: ${booking.clientEmail}
${booking.clientPhone ? `Phone: ${booking.clientPhone}\n` : ''}${booking.notes ? `Notes: ${booking.notes}\n` : ''}
Booking ID: ${booking.id}
            `.trim(),
            start: {
              dateTime: startDate.toISOString(),
              timeZone: booking.timezone,
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: booking.timezone,
            },
            attendees: [
              { email: booking.clientEmail, displayName: booking.clientName }
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 60 }, // 1 hour before
              ],
            },
          };

          const calendarResponse = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            sendUpdates: 'all', // Send calendar invites to attendees
          });

          // Save the Google Event ID
          if (calendarResponse.data.id) {
            await db.booking.update({
              where: { id },
              data: { googleEventId: calendarResponse.data.id },
            });
          }

          console.log(`Google Calendar event created: ${calendarResponse.data.htmlLink}`);
        } else {
          console.log('Google Calendar credentials not configured, skipping calendar event creation');
        }
      } catch (calendarError) {
        console.error("Failed to create Google Calendar event:", calendarError);
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE booking (soft delete by setting status to CANCELLED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await db.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Deleted by admin',
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
