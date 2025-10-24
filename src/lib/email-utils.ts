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
export function wrapInEmailTemplate(htmlContent: string): string {
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
      </div>
    </body>
    </html>
  `;
}
