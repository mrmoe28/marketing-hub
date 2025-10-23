import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Mail,
  Send,
  TrendingUp,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [clients, campaigns, recentJobs] = await Promise.all([
    db.client.findMany({
      include: {
        subscriptions: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    db.campaign.findMany({
      include: {
        _count: { select: { jobs: true } },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    db.emailJob.findMany({
      where: {
        status: { in: ["SENT", "SENDING"] },
      },
      include: {
        campaign: true,
        client: true,
      },
      take: 10,
      orderBy: { sentAt: "desc" },
    }),
  ]);

  const totalClients = await db.client.count();
  const totalCampaigns = await db.campaign.count();
  const sentEmails = await db.emailJob.count({ where: { status: "SENT" } });
  const openRate = await db.emailJob.count({ where: { openedAt: { not: null } } });

  const stats = {
    clients: totalClients,
    campaigns: totalCampaigns,
    sent: sentEmails,
    openRate: sentEmails > 0 ? Math.round((openRate / sentEmails) * 100) : 0,
    subscribed: clients.filter((c) => c.subscriptions?.some((s) => s.status === "subscribed"))
      .length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.subscribed} subscribed to emails
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaigns}</div>
            <p className="text-xs text-muted-foreground">Total email campaigns</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">All-time deliveries</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate}%</div>
            <p className="text-xs text-muted-foreground">Average across campaigns</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-transparent p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">AI Email Writer</h3>
                <p className="text-sm text-muted-foreground">Create human-sounding campaigns</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Use Claude AI to write personalized, natural-sounding emails that convert. No more
              generic corporate speak.
            </p>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20"
            >
              <Link href="/campaigns/new">
                Create Campaign <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/clients">
                  <Users className="mr-2 h-4 w-4" />
                  View Clients
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/campaigns">
                  <Mail className="mr-2 h-4 w-4" />
                  View Campaigns
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Campaigns</CardTitle>
              <CardDescription>Your latest email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Mail className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No campaigns yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign._count.jobs} recipients
                        </p>
                      </div>
                      <Badge
                        variant={
                          campaign.status === "SENT"
                            ? "default"
                            : campaign.status === "DRAFT"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {campaign.status === "SENT" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {campaign.status === "SCHEDULED" && <Clock className="mr-1 h-3 w-3" />}
                        {campaign.status.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest email activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Send className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-start gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/10">
                        <Send className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{job.campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent to {job.client.email}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {job.sentAt && formatDistanceToNow(job.sentAt, { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
