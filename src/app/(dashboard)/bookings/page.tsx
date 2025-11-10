import { db } from "@/lib/db";
import { BookingCalendar } from "@/components/BookingCalendar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = await db.booking.findMany({
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      scheduledDate: "desc",
    },
  });

  const now = new Date();
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    upcoming: bookings.filter(
      (b) => new Date(b.scheduledDate) > now && b.status !== "CANCELLED"
    ).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage customer appointments and scheduling
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="lg">
            <Link href="/book" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Public Booking Page
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Total Bookings
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Pending
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.pending}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              Confirmed
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.confirmed}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Upcoming
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.upcoming}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">All Bookings ({bookings.length})</h2>
          <p className="text-sm text-muted-foreground">
            View and manage customer appointments
          </p>
        </div>
        <div className="p-6">
          <BookingCalendar bookings={bookings} />
        </div>
      </div>
    </div>
  );
}
