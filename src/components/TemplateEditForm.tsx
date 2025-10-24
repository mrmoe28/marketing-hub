"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Image,
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

  return `Schedule your appointment here: ${bookingUrl}

Click the link above to view available times and book your appointment.`;
};

export function TemplateEditForm({ template }: { template: Template }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const charCount = formData.bodyText.length;
  const wordCount = formData.bodyText.trim().split(/\s+/).filter(Boolean).length;

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

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + textToInsert.length,
        start + textToInsert.length
      );
    }, 0);
  };

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.bodyText;
    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;

    setFormData((prev) => ({
      ...prev,
      bodyText: newText,
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
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

    insertAtCursor(`${linkText}: ${url}`);
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      alert("Please enter an email address");
      return;
    }

    try {
      // Implement your test email API here
      alert(`Test email would be sent to: ${testEmail}`);
      setShowTestEmail(false);
      setTestEmail("");
    } catch (error) {
      console.error("Error sending test email:", error);
      alert("Failed to send test email");
    }
  };

  const handleAIAssist = async () => {
    if (!aiPrompt) return;

    setIsAIProcessing(true);
    try {
      const response = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: formData.bodyText,
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        bodyText: data.result || prev.bodyText,
      }));

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
    return formData.bodyText
      .replace(/\[First Name\]/g, "John")
      .replace(/\[Last Name\]/g, "Doe")
      .replace(/\[Company Name\]/g, "Acme Corp")
      .replace(/\[Email\]/g, "john@acme.com")
      .replace(/\[Phone\]/g, "(555) 123-4567")
      .replace(/\[Address\]/g, "123 Main St");
  };

  return (
    <>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bodyText">
              Plain Text Body <span className="text-destructive">*</span>
            </Label>
            <div className="text-xs text-muted-foreground">
              {wordCount} words • {charCount} characters
            </div>
          </div>
          <div className="flex gap-4">
            <Textarea
              ref={textareaRef}
              id="bodyText"
              name="bodyText"
              value={formData.bodyText}
              onChange={handleChange}
              placeholder="Plain text version of the email"
              rows={20}
              className="flex-1 shadow-lg"
              required
            />
            <div className="flex flex-col gap-2 w-48 shadow-lg p-4 rounded-lg border bg-card">
              <div className="text-sm font-semibold mb-2">Toolbar</div>

              {/* Variables */}
              <Select onValueChange={(value) => insertAtCursor(value)}>
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
                  onClick={() => wrapSelection("**", "**")}
                  className="text-xs"
                  title="Bold"
                >
                  <Bold className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => wrapSelection("*", "*")}
                  className="text-xs"
                  title="Italic"
                >
                  <Italic className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertAtCursor("\n• ")}
                  className="text-xs"
                  title="Bullet List"
                >
                  <List className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertAtCursor("\n## ")}
                  className="text-xs"
                  title="Heading"
                >
                  <Heading className="h-3 w-3" />
                </Button>
              </div>

              {/* Emojis */}
              <Select onValueChange={(value) => insertAtCursor(value)}>
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
              <Select onValueChange={(value) => insertAtCursor(`\n\n${value}\n\n`)}>
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
                onClick={() => insertAtCursor(`\n\n${getBookingLinkText()}\n\n`)}
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
                onClick={() => insertAtCursor("\n\nUnsubscribe: [UNSUBSCRIBE_LINK]")}
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
                className="w-full justify-start text-xs"
              >
                <Image className="mr-2 h-3 w-3" />
                Image
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
              <p className="font-semibold">{formData.subject}</p>
            </div>
            <div className="border rounded-lg p-6 bg-background">
              <div className="whitespace-pre-wrap">{getPreviewText()}</div>
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
              Enter your email address to receive a test
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button onClick={handleSendTest} className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Send Test Email
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
