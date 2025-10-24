import { db } from "@/lib/db";
import { ClientTable } from "@/components/ClientTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload, Users, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await db.client.findMany({
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      subscriptions: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: clients.length,
    subscribed: clients.filter((c) => c.subscriptions?.some((s) => s.status === "subscribed"))
      .length,
    tags: Array.from(new Set(clients.flatMap((c) => c.tags.map((t) => t.tag.name)))).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-blue-500/20">
          <Link href="/import">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Total Clients
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Subscribed
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.subscribed}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Tags
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.tags}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-lg">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">All Clients ({clients.length})</h2>
          <p className="text-sm text-muted-foreground">View and manage your imported clients</p>
        </div>
        <div className="p-6">
          <ClientTable clients={clients} />
        </div>
      </div>
    </div>
  );
}
