import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to convert text to HTML with clickable links
function convertTextToHtml(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color: #2563eb; text-decoration: underline;">$1</a>'
  );

  html = html.replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
    ${html}
  </div>
</body>
</html>`;
}

async function main() {
  console.log("Seeding database...");

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: "solar" },
      update: {},
      create: { name: "solar" },
    }),
    prisma.tag.upsert({
      where: { name: "residential" },
      update: {},
      create: { name: "residential" },
    }),
    prisma.tag.upsert({
      where: { name: "commercial" },
      update: {},
      create: { name: "commercial" },
    }),
    prisma.tag.upsert({
      where: { name: "hot-lead" },
      update: {},
      create: { name: "hot-lead" },
    }),
  ]);

  const client1 = await prisma.client.upsert({
    where: { email: "john.doe@example.com" },
    update: {},
    create: {
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      company: "Doe Enterprises",
      phone: "+1-555-0123",
      city: "Atlanta",
      state: "GA",
      postalCode: "30301",
      country: "USA",
      filesPrefix: "clients/demo-001/",
    },
  });

  await prisma.tagOnClient.upsert({
    where: {
      clientId_tagId: {
        clientId: client1.id,
        tagId: tags[0].id,
      },
    },
    update: {},
    create: {
      clientId: client1.id,
      tagId: tags[0].id,
    },
  });

  await prisma.tagOnClient.upsert({
    where: {
      clientId_tagId: {
        clientId: client1.id,
        tagId: tags[1].id,
      },
    },
    update: {},
    create: {
      clientId: client1.id,
      tagId: tags[1].id,
    },
  });

  await prisma.subscription.upsert({
    where: {
      channel_clientId: {
        channel: "email",
        clientId: client1.id,
      },
    },
    update: {},
    create: {
      clientId: client1.id,
      channel: "email",
      status: "subscribed",
    },
  });

  console.log("✓ Seeded tags:", tags.map((t) => t.name).join(", "));
  console.log("✓ Seeded sample client:", client1.email);

  // Seed default email templates
  const templates = [
    {
      name: "Welcome Email",
      subject: "Welcome to [Company Name]!",
      category: "welcome",
      description: "A warm welcome email for new customers",
      bodyText: `Hi [First Name],

Welcome to [Company Name]! We're excited to have you on board.

We're here to help you get the most out of our services. If you have any questions, feel free to reach out.

Best regards,
The [Company Name] Team

Schedule your appointment: [BOOKING_URL]`,
      get bodyHtml() { return convertTextToHtml(this.bodyText); },
    },
    {
      name: "Follow-Up Email",
      subject: "Following up on your inquiry",
      category: "follow-up",
      description: "Professional follow-up email for prospects",
      bodyText: `Hi [First Name],

I wanted to follow up regarding your recent inquiry with [Company Name].

We're here to help answer any questions you might have about our services.

Here's what you can expect from us:
• Quick and effective solutions
• Expert guidance and support
• Personalized service

Would you like to schedule a call or meeting?

Best regards,
[Company Name]

Schedule your appointment: [BOOKING_URL]`,
      get bodyHtml() { return convertTextToHtml(this.bodyText); },
    },
    {
      name: "Special Offer",
      subject: "🎉 Special Offer Just for You, [First Name]!",
      category: "promotion",
      description: "Promotional email for special offers and deals",
      bodyText: `Hi [First Name],

We have a special offer just for you! 🎉

As a valued customer of [Company Name], we're excited to offer you exclusive benefits:

✨ Special pricing
✨ Priority service
✨ Expert consultation

This offer is available for a limited time only.

Don't miss out on this opportunity to save while getting the best service.

Best regards,
The [Company Name] Team

Schedule your appointment here: [BOOKING_URL]`,
      get bodyHtml() { return convertTextToHtml(this.bodyText); },
    },
  ];

  const createdTemplates = [];
  for (const template of templates) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { name: template.name },
    });

    if (!existing) {
      const created = await prisma.emailTemplate.create({
        data: template,
      });
      createdTemplates.push(`${created.name} (created)`);
    } else {
      // Update existing template with new content
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: {
          bodyText: template.bodyText,
          bodyHtml: template.bodyHtml,
          subject: template.subject,
          description: template.description,
          category: template.category,
        },
      });
      createdTemplates.push(`${existing.name} (updated)`);
    }
  }

  console.log("✓ Seeded email templates:", createdTemplates.join(", "));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
