import { db } from "@/lib/db";
import { TemplateList } from "@/components/TemplateList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, Sparkles, Wand2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await db.emailTemplate.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: templates.length,
    aiCreated: templates.filter((t) => t.isAiCreated).length,
    categories: Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))
      .length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your email templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <Wand2 className="mr-2 h-4 w-4" />
              Ask AI to Create
            </Link>
          </Button>
          <Button asChild size="lg" className="shadow-lg shadow-blue-500/20">
            <Link href="/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Total Templates
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              AI-Created
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.aiCreated}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Categories
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.categories}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">
            All Templates ({templates.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            View, preview, and manage your email templates
          </p>
        </div>
        <div className="p-6">
          <TemplateList templates={templates} />
        </div>
      </div>
    </div>
  );
}
