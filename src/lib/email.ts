import { Resend } from "resend";
import type { EmailJob } from "@prisma/client";

export interface EmailProvider {
  send(params: {
    to: string;
    from: string;
    fromName?: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void>;
}

class ResendEmailProvider implements EmailProvider {
  private resend: Resend;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async send(params: {
    to: string;
    from: string;
    fromName?: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    await this.resend.emails.send({
      to: params.to,
      from: params.fromName ? `${params.fromName} <${params.from}>` : params.from,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }
}

let _emailProvider: EmailProvider | null = null;

function getEmailProvider(): EmailProvider {
  if (!_emailProvider) {
    _emailProvider = new ResendEmailProvider();
  }
  return _emailProvider;
}

export const emailProvider = {
  send: (params: Parameters<EmailProvider["send"]>[0]) => {
    return getEmailProvider().send(params);
  },
};

export function buildTracking(job: EmailJob, html: string, text: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const openPixel = `<img src="${appUrl}/api/tracking/o/${job.openToken}" width="1" height="1" style="display:none" alt="" />`;

  const trackedHtml = html.replace(/<\/body>/i, `${openPixel}</body>`);

  const linkRegex = /href="([^"]+)"/gi;
  const trackedHtmlWithLinks = trackedHtml.replace(linkRegex, (match, url) => {
    if (url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) {
      return match;
    }
    const trackedUrl = `${appUrl}/api/tracking/c/${job.clickToken}?u=${encodeURIComponent(url)}`;
    return `href="${trackedUrl}"`;
  });

  const unsubLink = `${appUrl}/api/unsubscribe/${job.unsubToken}`;
  const finalHtml = trackedHtmlWithLinks.replace(
    /<\/body>/i,
    `<p style="font-size:12px;color:#666;margin-top:40px;text-align:center;">
      <a href="${unsubLink}" style="color:#666;">Unsubscribe</a>
    </p></body>`
  );

  const finalText = `${text}\n\n---\nUnsubscribe: ${unsubLink}`;

  return {
    html: finalHtml,
    text: finalText,
  };
}
