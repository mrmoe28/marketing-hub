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
