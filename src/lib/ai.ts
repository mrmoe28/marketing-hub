import Anthropic from "@anthropic-ai/sdk";
import { humanizeEmail } from "./humanizer";

const HUMANIZER_SYSTEM_PROMPT = `You're a sharp, friendly marketer writing short, human emails for small contractors. Write plainly, with light personality and concrete specifics. Use contractions. Vary sentence length. No buzzwords, no 'As an AI', no clichés like 'elevate' or 'unlock'. Keep it to 120–180 words unless told otherwise. Avoid generic openings; start with something specific. Offer a single clear next step. Optionally add a short P.S.

Important:
- Be direct and conversational
- Include specific details (dates, offers, benefits)
- Use natural language with mild imperfections
- Avoid corporate speak and AI tells
- Make it sound like a real person wrote it
- End with a clear call to action`;

export interface EmailWriteParams {
  brand: string;
  audience: string;
  goal: string;
  details: string;
  draft?: string;
  stylePreset?: "friendly" | "professional" | "casual";
}

export interface EmailWriteResult {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

export async function claudeWriteEmail(params: EmailWriteParams): Promise<EmailWriteResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const styleGuidance =
    params.stylePreset === "professional"
      ? "Use a professional but warm tone."
      : params.stylePreset === "casual"
        ? "Keep it very casual and conversational."
        : "Balance friendly and professional.";

  const userPrompt = `Write an email for:
Brand: ${params.brand}
Audience: ${params.audience}
Goal: ${params.goal}
Details: ${params.details}
${params.draft ? `\nExisting draft to improve:\n${params.draft}` : ""}
${styleGuidance}

Return JSON with this structure:
{
  "subject": "Email subject line (under 60 chars, no 'Subject:' prefix)",
  "body": "Email body (plain text, 120-180 words)"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: HUMANIZER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { subject: string; body: string };

  const humanizedBody = humanizeEmail(parsed.body);

  // Add signature to plain text
  const bodyWithSignature = humanizedBody + "\n\n---\nEKO SOLAR.LLC\nVisit our website: www.ekosolarpros.com";

  const bodyHtml = convertTextToHtml(humanizedBody);

  return {
    subject: parsed.subject,
    bodyText: bodyWithSignature,
    bodyHtml,
  };
}

function convertTextToHtml(text: string): string {
  const paragraphs = text
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  // Add signature with website link
  const signature = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        EKO SOLAR.LLC<br>
        <a href="https://www.ekosolarpros.com" style="color: #0066cc; text-decoration: underline;">Visit our website</a>
      </p>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size: 16px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
p { margin: 0 0 16px 0; }
a { color: #0066cc; }
</style>
</head>
<body>
${paragraphs}
${signature}
</body>
</html>`;
}
