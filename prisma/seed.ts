import { PrismaClient } from '@prisma/client';
import { seedChunkDrillItems, seedLearningItems } from '../apps/api/src/prisma/seed-data';

// Manual re-seed for local development (`pnpm seed`). The running app also
// seeds itself on every boot (apps/api/src/prisma/seed.service.ts) using the
// same shared functions, so this script is a convenience, not the only path.
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const learningItems = await seedLearningItems(prisma);
  console.log('Seed complete.', learningItems);

  const chunkDrillItems = await seedChunkDrillItems(prisma);
  console.log('Chunk drill seed complete.', chunkDrillItems);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
