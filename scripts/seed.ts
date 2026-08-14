// Seed script — populates the demo BroadcastHub database.
// Run with: bun run db:seed
import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/seed-data";

const db = new PrismaClient();

async function main() {
  const result = await seedDemoData(db);
  console.log(`Seeded ${result.contactsCount} contacts, campaigns, conversations, KB docs.`);
  console.log(`Org id: ${result.orgId}`);
  console.log(`Completed campaign id: ${result.completedCampaignId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
