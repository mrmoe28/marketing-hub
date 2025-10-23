import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus } from "lucide-react";
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

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: "secondary",
    SCHEDULED: "outline",
    SENDING: "default",
    SENT: "default",
    CANCELLED: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage your email campaigns</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns ({campaigns.length})</CardTitle>
          <CardDescription>View and manage your email campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
              <p className="text-sm text-muted-foreground">No campaigns yet</p>
              <Button asChild className="mt-4">
                <Link href="/campaigns/new">Create your first campaign</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.subject}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[campaign.status]}>
                        {campaign.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign._count.jobs}</TableCell>
                    <TableCell>{format(campaign.createdAt, "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
