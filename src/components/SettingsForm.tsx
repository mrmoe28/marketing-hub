"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

type CompanyProfile = {
  id: string;
  companyName: string;
  companyLogo: string | null;
  companyWebsite: string | null;
  industry: string | null;
  description: string | null;
  brandVoice: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  defaultSignature: string | null;
  defaultFromName: string | null;
  defaultFromEmail: string | null;
} | null;

export function SettingsForm({ profile }: { profile: CompanyProfile }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: profile?.companyName || "",
    companyLogo: profile?.companyLogo || "",
    companyWebsite: profile?.companyWebsite || "",
    industry: profile?.industry || "",
    description: profile?.description || "",
    brandVoice: profile?.brandVoice || "",
    primaryColor: profile?.primaryColor || "#3B82F6",
    secondaryColor: profile?.secondaryColor || "#8B5CF6",
    contactEmail: profile?.contactEmail || "",
    contactPhone: profile?.contactPhone || "",
    address: profile?.address || "",
    defaultSignature: profile?.defaultSignature || "",
    defaultFromName: profile?.defaultFromName || "",
    defaultFromEmail: profile?.defaultFromEmail || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save profile");

      router.refresh();
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Company Information
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Acme Inc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="Technology, Healthcare, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Website</Label>
            <Input
              id="companyWebsite"
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleChange}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo">Logo URL</Label>
            <Input
              id="companyLogo"
              name="companyLogo"
              value={formData.companyLogo}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
              type="url"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Company Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of your company..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brandVoice">Brand Voice & Tone</Label>
          <Textarea
            id="brandVoice"
            name="brandVoice"
            value={formData.brandVoice}
            onChange={handleChange}
            placeholder="e.g., Professional and friendly, casual and upbeat, formal and authoritative..."
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Describe how your brand communicates. The AI will use this to match
            your style.
          </p>
        </div>
      </div>

      {/* Branding */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Brand Colors
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                placeholder="#3B82F6"
              />
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="h-10 w-20 cursor-pointer rounded border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleChange}
                placeholder="#8B5CF6"
              />
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    secondaryColor: e.target.value,
                  }))
                }
                className="h-10 w-20 cursor-pointer rounded border"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Contact Information
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="contact@example.com"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              type="tel"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St, Suite 100, City, State 12345"
            rows={2}
          />
        </div>
      </div>

      {/* Email Defaults */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Email Defaults
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="defaultFromName">Default From Name</Label>
            <Input
              id="defaultFromName"
              name="defaultFromName"
              value={formData.defaultFromName}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultFromEmail">Default From Email</Label>
            <Input
              id="defaultFromEmail"
              name="defaultFromEmail"
              value={formData.defaultFromEmail}
              onChange={handleChange}
              placeholder="john@example.com"
              type="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultSignature">Default Email Signature</Label>
          <Textarea
            id="defaultSignature"
            name="defaultSignature"
            value={formData.defaultSignature}
            onChange={handleChange}
            placeholder="Best regards,&#10;John Doe&#10;CEO, Acme Inc."
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
