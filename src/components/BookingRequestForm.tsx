"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle } from "lucide-react";

export function BookingRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceType: "Solar System Troubleshooting",
    scheduledDate: "",
    scheduledTime: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone || null,
          serviceType: formData.serviceType,
          scheduledDate: dateTime.toISOString(),
          duration: 60,
          notes: formData.notes || null,
          status: "PENDING",
        }),
      });

      if (!response.ok) throw new Error("Failed to create booking");

      setIsSuccess(true);
      setFormData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        serviceType: "Solar System Troubleshooting",
        scheduledDate: "",
        scheduledTime: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to submit booking request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mb-2 text-2xl font-bold">Booking Request Submitted!</h3>
        <p className="mb-6 max-w-md text-muted-foreground">
          Thank you for your request. We'll review your preferred time and send you a confirmation email within 24 hours.
        </p>
        <Button onClick={() => setIsSuccess(false)}>
          Book Another Appointment
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Your Information
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="clientEmail"
              name="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={handleChange}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clientPhone">Phone Number (Optional)</Label>
            <Input
              id="clientPhone"
              name="clientPhone"
              type="tel"
              value={formData.clientPhone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Appointment Details
        </h3>

        <div className="space-y-2">
          <Label htmlFor="serviceType">
            Service Type <span className="text-destructive">*</span>
          </Label>
          <select
            id="serviceType"
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="Solar System Troubleshooting">Solar System Troubleshooting</option>
            <option value="Solar Panel Installation">Solar Panel Installation</option>
            <option value="System Maintenance">System Maintenance</option>
            <option value="Consultation">Consultation</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">
              Preferred Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="scheduledDate"
              name="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={handleChange}
              min={today}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledTime">
              Preferred Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="scheduledTime"
              name="scheduledTime"
              type="time"
              value={formData.scheduledTime}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Business hours: 9:00 AM - 5:00 PM (Mon-Fri)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any special requests or information we should know..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Request
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
