import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Business hours configuration
const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17,  // 5 PM
  daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
};

const SLOT_DURATION = 60; // minutes

// GET available time slots for a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const duration = parseInt(searchParams.get('duration') || '60');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Get all existing bookings in the date range
    const existingBookings = await db.booking.findMany({
      where: {
        scheduledDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        scheduledDate: true,
        duration: true,
      },
    });

    // Generate available slots
    const availableSlots: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();

      // Skip weekends
      if (!BUSINESS_HOURS.daysOfWeek.includes(dayOfWeek)) {
        continue;
      }

      // Generate time slots for this day
      for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, 0, 0, 0);

        // Check if slot is available
        const isBooked = existingBookings.some(booking => {
          const bookingStart = new Date(booking.scheduledDate);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
          const slotEnd = new Date(slotTime.getTime() + duration * 60000);

          // Check for overlap
          return (
            (slotTime >= bookingStart && slotTime < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotTime <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        if (!isBooked && slotTime > new Date()) {
          availableSlots.push(slotTime.toISOString());
        }
      }
    }

    return NextResponse.json({ availableSlots });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
