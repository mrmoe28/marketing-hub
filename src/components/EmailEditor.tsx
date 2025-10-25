"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles } from "lucide-react";

interface EmailEditorProps {
  onEmailChange: (email: { subject: string; html: string; text: string }) => void;
}

export function EmailEditor({ onEmailChange }: EmailEditorProps) {
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const { toast } = useToast();

  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [details, setDetails] = useState("");

  // Fetch company logo on mount
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data?.companyLogo) {
          setCompanyLogo(data.companyLogo);
        }
      })
      .catch(() => {});
  }, []);

  async function handleAIWrite() {
    if (!brand || !audience || !goal || !details) {
      toast({
        title: "Missing info",
        description: "Fill in all AI fields to generate email",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          audience,
          goal,
          details,
          stylePreset: "friendly",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI write failed");
      }

      setSubject(result.subject);
      setBodyText(result.bodyText);
      setBodyHtml(result.bodyHtml);

      onEmailChange({
        subject: result.subject,
        html: result.bodyHtml,
        text: result.bodyText,
      });

      toast({
        title: "Email generated",
        description: "AI has written your email",
      });
    } catch (error) {
      toast({
        title: "AI write failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  }

  const handleManualUpdate = () => {
    // Always add signature to emails
    const signature = "\n\n---\nEKO SOLAR.LLC\nVisit our website: www.ekosolarpros.com";
    const logoHtml = companyLogo ? 
      `<img src="${companyLogo.startsWith('http') ? companyLogo : `${window.location.origin}${companyLogo}`}" alt="EKO SOLAR.LLC" style="max-width: 150px; height: auto; margin-bottom: 10px; display: block;">` 
      : '';
    const htmlSignature = `<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">${logoHtml}<p style="margin: 0; font-size: 14px; color: #666;">EKO SOLAR.LLC<br><a href="https://www.ekosolarpros.com" style="color: #0066cc; text-decoration: underline;">Visit our website</a></p></div>`;
    
    // For text version, check if signature already exists before adding
    let textWithSignature = bodyText || "";
    if (textWithSignature && !textWithSignature.includes('www.ekosolarpros.com')) {
      textWithSignature = textWithSignature + signature;
    }
    
    // Build proper HTML with signature
    let finalHtml = bodyHtml;
    if (!finalHtml && bodyText) {
      // Convert plain text to HTML if no HTML version exists
      finalHtml = bodyText.replace(/\n/g, '<br>');
    }
    
    // Add signature to HTML if it doesn't already have it
    if (finalHtml && !finalHtml.includes('ekosolarpros.com')) {
      finalHtml = finalHtml + htmlSignature;
    }
    
    onEmailChange({ 
      subject, 
      html: finalHtml, 
      text: textWithSignature 
    });
  };

  // Call handleManualUpdate when component mounts or when bodyText changes from empty to having content
  useEffect(() => {
    if (bodyText && !bodyHtml) {
      handleManualUpdate();
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Content</CardTitle>
        <CardDescription>Write your email or use AI to generate it</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-sm font-medium">AI Email Writer</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="EKO Solar"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Input
                id="audience"
                placeholder="past solar leads in Georgia"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Input
              id="goal"
              placeholder="book a quick call for fall promo"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              placeholder="10% off batteries through Nov 15; local install crew; financing available"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <Button onClick={handleAIWrite} disabled={aiLoading} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {aiLoading ? "Generating..." : "Generate Email with AI"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
              }}
              onBlur={handleManualUpdate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body (Plain Text)</Label>
            <Textarea
              id="body"
              rows={12}
              placeholder="Write your email here..."
              value={bodyText}
              onChange={(e) => {
                setBodyText(e.target.value);
              }}
              onBlur={handleManualUpdate}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
