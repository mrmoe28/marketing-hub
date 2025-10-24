import { BookingRequestForm } from "@/components/BookingRequestForm";
import { db } from "@/lib/db";
import { Calendar, Clock, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicBookingPage() {
  const profile = await db.companyProfile.findFirst();
  const companyName = profile?.companyName || "Our Company";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              Schedule an Appointment
            </h1>
            <p className="text-lg text-muted-foreground">
              Book a convenient time for your visit with {companyName}
            </p>
          </div>

          {/* Info Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-1 font-semibold">Flexible Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Choose a date and time that works best for you
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-1 font-semibold">Quick Response</h3>
              <p className="text-sm text-muted-foreground">
                We'll confirm your appointment within 24 hours
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
                <CheckCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-1 font-semibold">Easy Process</h3>
              <p className="text-sm text-muted-foreground">
                Simple form, no account required
              </p>
            </div>
          </div>

          {/* Booking Form */}
          <div className="rounded-lg border bg-white shadow-lg dark:bg-gray-800">
            <div className="border-b p-6">
              <h2 className="text-2xl font-semibold">Request an Appointment</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill out the form below and we'll get back to you to confirm your appointment
              </p>
            </div>
            <div className="p-6">
              <BookingRequestForm />
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Business Hours: Monday - Friday, 9:00 AM - 5:00 PM</p>
            {profile?.contactPhone && (
              <p className="mt-1">
                Questions? Call us at {profile.contactPhone}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
