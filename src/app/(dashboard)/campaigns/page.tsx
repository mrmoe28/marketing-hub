import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Mail, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await db.campaign.findMany({
    include: {
      _count: {
        select: {
          jobs: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const statusConfig: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
  > = {
    DRAFT: { variant: "secondary", icon: Mail },
    SCHEDULED: { variant: "outline", icon: Clock },
    SENDING: { variant: "default", icon: Send },
    SENT: { variant: "default", icon: CheckCircle2 },
    CANCELLED: { variant: "destructive", icon: XCircle },
  };

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter((c) => c.status === "SENT").length,
    draft: campaigns.filter((c) => c.status === "DRAFT").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage your email campaigns</p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
        >
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="h-4 w-4" />
              Total Campaigns
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Send className="h-4 w-4" />
              Sent
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.sent}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="h-4 w-4" />
              Drafts
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.draft}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">All Campaigns ({campaigns.length})</h2>
          <p className="text-sm text-muted-foreground">View and manage your email campaigns</p>
        </div>
        <div className="p-6">
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 p-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/10 to-violet-600/10">
                <Mail className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">No campaigns yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Create your first email campaign with AI-powered copy
              </p>
              <Button asChild className="mt-6">
                <Link href="/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const config = statusConfig[campaign.status];
                    const Icon = config.icon;

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {campaign.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign._count.jobs}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(campaign.createdAt, "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
