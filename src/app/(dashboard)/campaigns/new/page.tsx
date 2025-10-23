"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentBuilder } from "@/components/SegmentBuilder";
import { EmailEditor } from "@/components/EmailEditor";
import { EmailPreview } from "@/components/EmailPreview";
import { useToast } from "@/components/ui/use-toast";
import type { Client, Tag, TagOnClient } from "@prisma/client";

type ClientWithTags = Client & {
  tags: (TagOnClient & { tag: Tag })[];
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [clients, setClients] = useState<ClientWithTags[]>([]);
  const [loading, setLoading] = useState(true);

  const [campaignName, setCampaignName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [email, setEmail] = useState({ subject: "", html: "", text: "" });

  useEffect(() => {
    fetch("/api/import")
      .then((res) => res.json())
      .catch(() => []);

    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateDraft() {
    if (!campaignName || !fromEmail || !email.subject) {
      toast({
        title: "Missing fields",
        description: "Fill in campaign name, from email, and subject",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          subject: email.subject,
          fromEmail,
          fromName: fromName || undefined,
          bodyHtml: email.html,
          bodyText: email.text,
          clientIds: selectedClients,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create campaign");
      }

      toast({
        title: "Campaign created",
        description: `Draft created with ${result.jobsCreated} recipients`,
      });

      router.push("/campaigns");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  async function handleSendNow() {
    if (!campaignName || !fromEmail || !email.subject) {
      toast({
        title: "Missing fields",
        description: "Fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const createResponse = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          subject: email.subject,
          fromEmail,
          fromName: fromName || undefined,
          bodyHtml: email.html,
          bodyText: email.text,
          clientIds: selectedClients,
        }),
      });

      const campaign = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(campaign.error || "Failed to create campaign");
      }

      const sendResponse = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.campaign.id,
          when: "now",
        }),
      });

      const result = await sendResponse.json();

      if (!sendResponse.ok) {
        throw new Error(result.error || "Failed to send campaign");
      }

      toast({
        title: "Campaign sent",
        description: `Sent ${result.sent} emails, ${result.failed} failed, ${result.suppressed} suppressed`,
      });

      router.push("/campaigns");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Campaign</h1>
        <p className="text-muted-foreground">Create and send an email campaign</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Fall 2024 Promo"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email</Label>
                <Input
                  id="from-email"
                  type="email"
                  placeholder="hello@example.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-name">From Name (optional)</Label>
                <Input
                  id="from-name"
                  placeholder="EKO Solar"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <SegmentBuilder clients={clients} onAudienceChange={setSelectedClients} />

          <EmailEditor onEmailChange={setEmail} />
        </div>

        <div className="space-y-6">
          <EmailPreview
            subject={email.subject}
            html={email.html}
            fromEmail={fromEmail}
            fromName={fromName}
          />

          <Card>
            <CardContent className="space-y-3 pt-6">
              <Button onClick={handleCreateDraft} variant="outline" className="w-full">
                Save as Draft
              </Button>
              <Button onClick={handleSendNow} className="w-full">
                Send Now to {selectedClients.length} Recipients
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
