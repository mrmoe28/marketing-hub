import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const db = new PrismaClient();

async function exportClients() {
  console.log("Exporting clients to file system...");

  const clients = await db.client.findMany({
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  console.log(`Found ${clients.length} clients`);

  // Group by state
  const clientsByState: Record<string, any[]> = {};

  clients.forEach((client) => {
    const state = client.state || "unknown";
    if (!clientsByState[state]) {
      clientsByState[state] = [];
    }

    clientsByState[state].push({
      id: client.id,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      city: client.city,
      state: client.state,
      tags: client.tags.map((t) => t.tag.name),
      customFields: client.customFields,
      createdAt: client.createdAt,
    });
  });

  // Create data/clients directory
  const dataDir = join(process.cwd(), "data", "clients");
  mkdirSync(dataDir, { recursive: true });

  // Export each state to a file
  Object.entries(clientsByState).forEach(([state, stateClients]) => {
    const filename = join(dataDir, `${state.toLowerCase()}.json`);
    writeFileSync(filename, JSON.stringify(stateClients, null, 2));
    console.log(`✓ Exported ${stateClients.length} clients to ${state}.json`);
  });

  // Create index file with summary
  const index = {
    totalClients: clients.length,
    states: Object.entries(clientsByState).map(([state, stateClients]) => ({
      state,
      count: stateClients.length,
      file: `${state.toLowerCase()}.json`,
    })),
    lastUpdated: new Date().toISOString(),
  };

  writeFileSync(
    join(dataDir, "index.json"),
    JSON.stringify(index, null, 2)
  );
  console.log(`✓ Created index.json`);
  console.log(`\nExport complete! ${clients.length} clients in ${Object.keys(clientsByState).length} states`);

  await db.$disconnect();
}

exportClients().catch(console.error);
