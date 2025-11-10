import { db } from "@/lib/db";
import { SettingsForm } from "@/components/SettingsForm";
import { Settings as SettingsIcon, Building2, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await db.companyProfile.findFirst();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your company profile and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Company Profile</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              This information is used by the AI agent to personalize email templates
              and campaigns
            </p>
          </div>
          <div className="p-6">
            <SettingsForm profile={profile} />
          </div>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-blue-600/10 to-violet-600/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 font-semibold">AI-Powered Personalization</h3>
              <p className="text-sm text-muted-foreground">
                The AI agent uses your company profile to create branded email
                templates that match your voice and style. Make sure to fill out as
                much information as possible for better results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
