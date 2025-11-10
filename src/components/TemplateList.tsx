"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Trash2, Sparkles, Calendar, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: string | null;
  description: string | null;
  isAiCreated: boolean;
  createdAt: Date;
};

export function TemplateList({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTemplate) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/templates/${deleteTemplate.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      router.refresh();
      setDeleteTemplate(null);
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No templates yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Create your first template by asking the AI assistant or creating one manually
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          <Sparkles className="mr-2 h-4 w-4" />
          Ask AI to Create Template
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group relative rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  {template.isAiCreated && (
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-600/10 to-violet-600/10 text-blue-600"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      AI
                    </Badge>
                  )}
                  {template.category && (
                    <Badge variant="outline">{template.category}</Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Subject: {template.subject}
                  </p>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/templates/${template.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTemplate(template)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate?.name}
              {previewTemplate?.isAiCreated && (
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-blue-600/10 to-violet-600/10 text-blue-600"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI-Created
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Subject: {previewTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="rounded-lg border bg-white p-4">
              <iframe
                srcDoc={previewTemplate?.bodyHtml || ""}
                className="h-[600px] w-full border-0"
                sandbox="allow-same-origin"
                title="Email Preview"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template "{deleteTemplate?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
