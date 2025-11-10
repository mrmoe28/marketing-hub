/**
 * Convert plain text to HTML with clickable links
 */
export function convertTextToHtml(text: string): string {
  // Escape HTML characters
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert URLs to clickable links with better styling
  html = html.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color: #2563eb; text-decoration: underline;">$1</a>'
  );

  // Convert line breaks to <br> tags
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Wrap text in a basic email HTML template
 */
export function wrapInEmailTemplate(htmlContent: string, logoUrl?: string | null): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
        ${htmlContent}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
          ${logoUrl ? `<img src="${logoUrl.startsWith('http') ? logoUrl : `https://www.ekosolarpros.com${logoUrl}`}" alt="EKO SOLAR.LLC" style="max-width: 150px; height: auto; margin-bottom: 10px; display: block;">` : ''}
          <p style="margin: 0; font-size: 14px; color: #666;">
            EKO SOLAR.LLC<br>
            <a href="https://www.ekosolarpros.com" style="color: #0066cc; text-decoration: underline;">Visit our website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
