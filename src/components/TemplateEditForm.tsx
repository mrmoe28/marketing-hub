"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Loader2,
  Save,
  Image,
  Video,
  Link,
  Tag,
  Eye,
  Bold,
  Italic,
  List,
  Smile,
  MousePointer,
  LinkIcon,
  BarChart,
  Mail,
  Sparkles,
  Type,
  Heading,
  Calendar,
  Undo,
  Redo,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Template = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: string | null;
  description: string | null;
};

const MERGE_TAGS = [
  { label: "First Name", value: "[First Name]" },
  { label: "Last Name", value: "[Last Name]" },
  { label: "Company Name", value: "[Company Name]" },
  { label: "Email", value: "[Email]" },
  { label: "Phone", value: "[Phone]" },
  { label: "Address", value: "[Address]" },
];

const COMMON_EMOJIS = [
  "😊", "👍", "🎉", "✨", "💡", "🚀", "📧", "📅",
  "⭐", "💼", "🔔", "✅", "❤️", "🎯", "📊", "💪",
];

const CTA_TEMPLATES = [
  "Schedule Your Appointment Now →",
  "Learn More →",
  "Get Started Today →",
  "Contact Us →",
  "View Details →",
  "Book Now →",
  "Download Now →",
  "Sign Up Free →",
];

// Get booking URL - will be replaced with actual URL when sending
const getBookingLinkText = () => {
  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/book`
    : '[BOOKING_URL]';

  return `Schedule your appointment: ${bookingUrl}`;
};

export function TemplateEditForm({ template }: { template: Template }) {
  const router = useRouter();
  const [editor, setEditor] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: template.name,
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    bodyText: template.bodyText,
    category: template.category || "",
    description: template.description || "",
  });

  const charCount = formData.bodyHtml.replace(/<[^>]*>/g, '').length;
  const wordCount = formData.bodyHtml.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;

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

  // Helper functions for rich text editor
  const insertText = (text: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(text).run();
  };

  const insertLink = (url: string, text?: string) => {
    if (!editor) return;
    if (text) {
      editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/svg+xml,image/webp";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Check file size before upload (5MB limit for images)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("Image file is too large. Maximum size is 5MB.");
        return;
      }

      setIsAIProcessing(true);
      try {
        // Use Vercel Blob client-side upload
        const { upload } = await import('@vercel/blob/client');
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/images/upload',
        });

        // Insert image into editor
        if (editor) {
          editor.chain().focus().setImage({ src: blob.url }).run();
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsAIProcessing(false);
      }
    };
    input.click();
  };

  const handleVideoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,video/webm,video/ogg,video/quicktime";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Check file size before upload (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert("Video file is too large. Maximum size is 50MB.");
        return;
      }

      setIsAIProcessing(true);
      try {
        // Use Vercel Blob client-side upload (bypasses API route body size limits)
        const { upload } = await import('@vercel/blob/client');
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/images/upload',
        });

        // Insert video into editor
        if (editor) {
          editor.chain().focus().setVideo({ src: blob.url }).run();
        }
      } catch (error) {
        console.error("Error uploading video:", error);
        alert(`Failed to upload video: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsAIProcessing(false);
      }
    };
    input.click();
  };

  const handleInsertLink = () => {
    const url = prompt("Enter the URL:");
    if (!url) return;

    const text = prompt("Enter link text (optional):");
    insertLink(url, text || undefined);
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      alert("Please enter an email address");
      return;
    }

    setIsAIProcessing(true); // Reuse loading state
    try {
      const response = await fetch(`/api/templates/${template.id}/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test email");
      }

      alert(`✅ Test email sent successfully to ${testEmail}!`);
      setShowTestEmail(false);
      setTestEmail("");
    } catch (error) {
      console.error("Error sending test email:", error);
      alert(`❌ Failed to send test email: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAIAssist = async () => {
    if (!aiPrompt) return;

    setIsAIProcessing(true);
    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: formData.bodyHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI request failed");
      }

      const data = await response.json();
      const htmlResult = data.result || formData.bodyHtml;

      setFormData((prev) => ({
        ...prev,
        bodyHtml: htmlResult,
        bodyText: htmlResult.replace(/<[^>]*>/g, ''),
      }));

      // Update editor content
      if (editor) {
        editor.commands.setContent(htmlResult);
      }

      setShowAI(false);
      setAiPrompt("");
    } catch (error) {
      console.error("Error with AI assist:", error);
      alert("AI assist failed. Please try again.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const getPreviewText = () => {
    const sampleData: Record<string, string> = {
      "[First Name]": "John",
      "[Last Name]": "Doe",
      "[Company Name]": "Acme Corp",
      "[Email]": "john@acme.com",
      "[Phone]": "(555) 123-4567",
      "[Address]": "123 Main St, City, ST 12345",
      "[BOOKING_URL]": typeof window !== 'undefined' ? `${window.location.origin}/book` : "yourdomain.com/book",
      "[UNSUBSCRIBE_LINK]": "yourdomain.com/unsubscribe",
    };

    let bodyHtml = formData.bodyHtml;
    let subject = formData.subject;

    Object.entries(sampleData).forEach(([tag, value]) => {
      const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      bodyHtml = bodyHtml.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    return { body: bodyHtml, subject };
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
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
              className="shadow-md"
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
              className="shadow-md"
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
            className="shadow-md"
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
            className="shadow-md"
          />
        </div>

        <div className="grid grid-cols-[1fr,400px] gap-4">
          {/* Left Side: Editor + Toolbar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="bodyText">
                Email Editor <span className="text-destructive">*</span>
              </Label>
              <div className="text-xs text-muted-foreground">
                {wordCount} words • {charCount} characters
              </div>
            </div>

            <div className="grid grid-cols-[1fr,auto] gap-3">
              {/* Editor */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Template (with merge tags)</div>
                <RichTextEditor
                  content={formData.bodyHtml}
                  onChange={(html) => setFormData(prev => ({ ...prev, bodyHtml: html, bodyText: html.replace(/<[^>]*>/g, '') }))}
                  onReady={(editorInstance) => setEditor(editorInstance)}
                  placeholder="Start typing your email..."
                />
              </div>

              {/* Toolbar */}
              <div className="flex flex-col gap-1.5 w-44 shadow-lg p-3 rounded-lg border bg-card h-fit">
              <div className="text-sm font-semibold mb-1">Toolbar</div>

              {/* Variables */}
              <Select onValueChange={(value) => insertText(value)}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <Tag className="mr-2 h-3 w-3" />
                  <SelectValue placeholder="Variables" />
                </SelectTrigger>
                <SelectContent>
                  {MERGE_TAGS.map((tag) => (
                    <SelectItem key={tag.value} value={tag.value}>
                      {tag.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preview */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="w-full justify-start text-xs"
              >
                <Eye className="mr-2 h-3 w-3" />
                Preview
              </Button>

              {/* Text Formatting */}
              <div className="grid grid-cols-2 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className="text-xs"
                  title="Bold"
                  disabled={!editor}
                >
                  <Bold className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className="text-xs"
                  title="Italic"
                  disabled={!editor}
                >
                  <Italic className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className="text-xs"
                  title="Bullet List"
                  disabled={!editor}
                >
                  <List className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className="text-xs"
                  title="Heading"
                  disabled={!editor}
                >
                  <Heading className="h-3 w-3" />
                </Button>
              </div>

              {/* Undo/Redo */}
              <div className="grid grid-cols-2 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor?.chain().focus().undo().run()}
                  className="text-xs"
                  title="Undo"
                  disabled={!editor || !editor.can().undo()}
                >
                  <Undo className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor?.chain().focus().redo().run()}
                  className="text-xs"
                  title="Redo"
                  disabled={!editor || !editor.can().redo()}
                >
                  <Redo className="h-3 w-3" />
                </Button>
              </div>

              {/* Emojis */}
              <Select onValueChange={(value) => insertText(value)}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <Smile className="mr-2 h-3 w-3" />
                  <SelectValue placeholder="Emojis" />
                </SelectTrigger>
                <SelectContent>
                  <div className="grid grid-cols-4 gap-1 p-2">
                    {COMMON_EMOJIS.map((emoji, idx) => (
                      <SelectItem key={idx} value={emoji}>
                        {emoji}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>

              {/* CTA */}
              <Select onValueChange={(value) => insertText(`<br><br>${value}<br><br>`)}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <MousePointer className="mr-2 h-3 w-3" />
                  <SelectValue placeholder="CTA" />
                </SelectTrigger>
                <SelectContent>
                  {CTA_TEMPLATES.map((cta, idx) => (
                    <SelectItem key={idx} value={cta}>
                      {cta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Booking Link */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertText(`<br><br>${getBookingLinkText()}<br><br>`)}
                className="w-full justify-start text-xs"
              >
                <Calendar className="mr-2 h-3 w-3" />
                Booking
              </Button>

              {/* Unsubscribe */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertText("<br><br>Unsubscribe: [UNSUBSCRIBE_LINK]")}
                className="w-full justify-start text-xs"
              >
                <LinkIcon className="mr-2 h-3 w-3" />
                Unsubscribe
              </Button>

              {/* Image */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImageUpload}
                disabled={isAIProcessing}
                className="w-full justify-start text-xs"
                title="Upload JPEG, PNG, SVG, or WebP (max 5MB)"
              >
                {isAIProcessing ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Image className="mr-2 h-3 w-3" />
                )}
                {isAIProcessing ? "Uploading..." : "Image"}
              </Button>

              {/* Video */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVideoUpload}
                disabled={isAIProcessing}
                className="w-full justify-start text-xs"
                title="Upload MP4, WebM, OGG, or MOV (max 50MB, 30 seconds)"
              >
                {isAIProcessing ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Video className="mr-2 h-3 w-3" />
                )}
                {isAIProcessing ? "Uploading..." : "Video"}
              </Button>

              {/* Link */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleInsertLink}
                className="w-full justify-start text-xs"
              >
                <Link className="mr-2 h-3 w-3" />
                Link
              </Button>

              {/* Test Email */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTestEmail(true)}
                className="w-full justify-start text-xs"
              >
                <Mail className="mr-2 h-3 w-3" />
                Send Test
              </Button>

              {/* AI Assistant */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAI(true)}
                className="w-full justify-start text-xs"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                AI Assist
              </Button>
            </div>
            </div>
          </div>

          {/* Right Side: Live Preview */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Live Preview (what recipients see)</div>
            <div className="shadow-lg rounded-lg border bg-card p-4 min-h-[600px] max-h-[700px] overflow-y-auto sticky top-4">
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <div className="text-xs text-muted-foreground mb-1">Subject:</div>
                  <div className="font-semibold text-sm">{getPreviewText().subject}</div>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: getPreviewText().body
                  }}
                />
              </div>
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

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              This is how your email will look with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Subject:</Label>
              <p className="font-semibold">{getPreviewText().subject}</p>
            </div>
            <div className="border rounded-lg p-6 bg-background">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: getPreviewText().body }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={showTestEmail} onOpenChange={setShowTestEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a test with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={isAIProcessing}
            />
            <Button
              onClick={handleSendTest}
              disabled={isAIProcessing || !testEmail}
              className="w-full"
            >
              {isAIProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={showAI} onOpenChange={setShowAI}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Writing Assistant</DialogTitle>
            <DialogDescription>
              Ask AI to improve your email content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="E.g., 'Make it more professional' or 'Add a friendly tone'"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAIAssist}
              disabled={isAIProcessing || !aiPrompt}
              className="w-full"
            >
              {isAIProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Improve with AI
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
