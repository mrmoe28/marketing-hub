"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailPreviewProps {
  subject: string;
  html: string;
  fromEmail: string;
  fromName?: string;
}

export function EmailPreview({ subject, html, fromEmail, fromName }: EmailPreviewProps) {
  // Add unsubscribe footer to match what will be sent
  const previewHtml = html ? 
    `${html}
    <p style="font-size:12px;color:#666;margin-top:40px;text-align:center;">
      <a href="#" style="color:#666;">Unsubscribe</a>
    </p>` 
    : "<p>(No content)</p>";

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
