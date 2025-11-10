"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailPreviewProps {
  subject: string;
  html: string;
  fromEmail: string;
  fromName?: string;
}

export function EmailPreview({ subject, html, fromEmail, fromName }: EmailPreviewProps) {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

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

  // Add logo and unsubscribe footer to match what will be sent
  let previewHtml = html || "<p>(No content)</p>";
  
  // Add logo to preview if not already in HTML
  if (companyLogo && html && !html.includes(companyLogo)) {
    const logoUrl = companyLogo.startsWith('http') ? companyLogo : `${window.location.origin}${companyLogo}`;
    previewHtml = html.replace(
      /<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">/,
      `<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
        <img src="${logoUrl}" alt="Company Logo" style="max-width: 150px; height: auto; margin-bottom: 10px; display: block;">`
    );
  }
  
  // Add unsubscribe link
  previewHtml = `${previewHtml}
    <p style="font-size:12px;color:#666;margin-top:40px;text-align:center;">
      <a href="#" style="color:#666;">Unsubscribe</a>
    </p>`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 rounded-lg border bg-white p-6 text-black">
          <div className="border-b pb-4">
            <p className="text-sm text-gray-600">From:</p>
            <p className="font-medium">
              {fromName ? `${fromName} <${fromEmail}>` : fromEmail}
            </p>
          </div>

          <div className="border-b pb-4">
            <p className="text-sm text-gray-600">Subject:</p>
            <p className="font-medium">{subject || "(No subject)"}</p>
          </div>

          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
