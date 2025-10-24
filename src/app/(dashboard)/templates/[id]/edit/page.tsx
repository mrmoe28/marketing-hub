import { db } from "@/lib/db";
import { TemplateEditForm } from "@/components/TemplateEditForm";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TemplateEditPage({ params }: PageProps) {
  const { id } = await params;

  const template = await db.emailTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
        <p className="text-muted-foreground">
          Update your email template
        </p>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4">
          <TemplateEditForm template={template} />
        </div>
      </div>
    </div>
  );
}
