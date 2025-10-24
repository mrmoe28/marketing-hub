"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Loader2, Save, Image, Link } from "lucide-react";

type Template = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: string | null;
  description: string | null;
};

export function TemplateEditForm({ template }: { template: Template }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: template.name,
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    bodyText: template.bodyText,
    category: template.category || "",
    description: template.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update template");

      router.push("/templates");
      router.refresh();
    } catch (error) {
      console.error("Error updating template:", error);
      alert("Failed to update template. Please try again.");
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

  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.bodyText;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setFormData((prev) => ({
      ...prev,
      bodyText: before + textToInsert + after,
    }));

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + textToInsert.length,
        start + textToInsert.length
      );
    }, 0);
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // For now, just insert the image name as placeholder
      // You can extend this to upload to a server and get URL
      const imageUrl = `[Image: ${file.name}]`;
      insertAtCursor(imageUrl);
    };
    input.click();
  };

  const handleInsertLink = () => {
    const url = prompt("Enter the URL:");
    if (!url) return;

    const text = prompt("Enter link text (optional):");
    const linkText = text || url;

    insertAtCursor(`[${linkText}](${url})`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Template Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Welcome Email"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="welcome, promotion, etc."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject Line <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Subject line for the email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of what this template is for"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyText">
          Plain Text Body <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-4">
          <Textarea
            ref={textareaRef}
            id="bodyText"
            name="bodyText"
            value={formData.bodyText}
            onChange={handleChange}
            placeholder="Plain text version of the email"
            rows={20}
            className="flex-1"
            required
          />
          <div className="flex flex-col gap-2 w-32">
            <div className="text-sm font-medium mb-2">Toolbar</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImageUpload}
              className="w-full justify-start"
            >
              <Image className="mr-2 h-4 w-4" />
              Image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleInsertLink}
              className="w-full justify-start"
            >
              <Link className="mr-2 h-4 w-4" />
              Link
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/templates")}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
