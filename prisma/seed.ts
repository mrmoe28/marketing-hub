import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      bodyHtml: `<p>Hi [First Name],</p><p>Welcome to [Company Name]! We're excited to have you.</p>`,
      bodyText: `Hi [First Name],

Welcome to [Company Name]! We're excited to have you on board.

We're here to help you get the most out of our services. If you have any questions, feel free to reach out.

Best regards,
The [Company Name] Team

Schedule your appointment here: [BOOKING_URL]

Click the link above to view available times and book your appointment.`,
    },
    {
      name: "Follow-Up Email",
      subject: "Following up on your inquiry",
      category: "follow-up",
      description: "Professional follow-up email for prospects",
      bodyHtml: `<p>Hi [First Name],</p><p>I wanted to follow up regarding your recent inquiry.</p>`,
      bodyText: `Hi [First Name],

I wanted to follow up regarding your recent inquiry with [Company Name].

We're here to help answer any questions you might have about our services.

Here's what you can expect from us:
• Quick and effective solutions
• Expert guidance and support
• Personalized service

Would you like to schedule a call or meeting?

Schedule Your Appointment Now → [BOOKING_URL]

Best regards,
[Company Name]

If you have any questions or need immediate assistance, feel free to contact our support team at any time.`,
    },
    {
      name: "Special Offer",
      subject: "🎉 Special Offer Just for You, [First Name]!",
      category: "promotion",
      description: "Promotional email for special offers and deals",
      bodyHtml: `<p>Hi [First Name],</p><p>We have a special offer just for you!</p>`,
      bodyText: `Hi [First Name],

We have a special offer just for you! 🎉

As a valued customer of [Company Name], we're excited to offer you exclusive benefits:

✨ Special pricing
✨ Priority service
✨ Expert consultation

This offer is available for a limited time only.

Get Started Today → [BOOKING_URL]

Don't miss out on this opportunity to save while getting the best service.

Best regards,
The [Company Name] Team

Schedule your appointment here: [BOOKING_URL]

Click the link above to view available times and book your appointment.`,
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
      createdTemplates.push(created.name);
    } else {
      createdTemplates.push(`${existing.name} (already exists)`);
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
