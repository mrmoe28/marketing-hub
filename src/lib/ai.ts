import OpenAI from "openai";
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
  companyLogo?: string | null;
  companyWebsite?: string;
}

export interface EmailWriteResult {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

export async function claudeWriteEmail(params: EmailWriteParams): Promise<EmailWriteResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    ...(process.env.OPENAI_API_BASE_URL && { baseURL: process.env.OPENAI_API_BASE_URL })
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

  const model = process.env.MODEL_NAME || "gpt-3.5-turbo";

  const response = await openai.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [
      { role: "system", content: HUMANIZER_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Unexpected response from AI");
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { subject: string; body: string };

  const humanizedBody = humanizeEmail(parsed.body);

  // Add signature to plain text
  const websiteUrl = params.companyWebsite || "www.ekosolarpros.com";
  const bodyWithSignature = humanizedBody + `\n\n---\nEKO SOLAR.LLC\nVisit our website: ${websiteUrl}`;

  const bodyHtml = convertTextToHtml(humanizedBody, params.companyLogo, websiteUrl);

  return {
    subject: parsed.subject,
    bodyText: bodyWithSignature,
    bodyHtml,
  };
}

function convertTextToHtml(text: string, logoUrl?: string | null, websiteUrl: string = "www.ekosolarpros.com"): string {
  const paragraphs = text
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  // Add signature with logo and website link
  const logoHtml = logoUrl ? 
    `<img src="${logoUrl.startsWith('http') ? logoUrl : `https://${websiteUrl}${logoUrl}`}" alt="EKO SOLAR.LLC" style="max-width: 150px; height: auto; margin-bottom: 10px;">` 
    : '';
    
  const signature = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
      ${logoHtml}
      <p style="margin: 0; font-size: 14px; color: #666;">
        EKO SOLAR.LLC<br>
        <a href="https://${websiteUrl}" style="color: #0066cc; text-decoration: underline;">Visit our website</a>
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
