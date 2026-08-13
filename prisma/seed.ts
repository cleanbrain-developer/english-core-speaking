import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();

interface SeedRow {
  id: number;
  category: string;
  english: string;
  korean: string;
  example: string;
  rank: number;
  datasetVersion: string;
  sourceType: string;
}

const EXPECTED_COUNTS: Record<string, number> = {
  'Conversation Chunk': 300,
  'Phrasal Verb': 150,
  'Core Word': 700,
  'Work English': 200,
};

async function main(): Promise<void> {
  const seedPath = join(__dirname, '..', 'data', 'speaking_core_1350_seed_v2.json');
  const rows: SeedRow[] = JSON.parse(readFileSync(seedPath, 'utf-8'));

  if (rows.length !== 1350) {
    throw new Error(`Expected 1350 seed rows, found ${rows.length}`);
  }

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.category] = (counts[row.category] ?? 0) + 1;
  for (const [category, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[category] !== expected) {
      throw new Error(`Category "${category}": expected ${expected}, found ${counts[category] ?? 0}`);
    }
  }

  // Upsert by canonical id keeps the import deterministic and idempotent —
  // re-running the seed never duplicates rows.
  for (const row of rows) {
    await prisma.learningItem.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        category: row.category,
        rank: row.rank,
        english: row.english,
        korean: row.korean,
        example: row.example,
        datasetVersion: row.datasetVersion,
        sourceType: row.sourceType,
      },
      update: {
        category: row.category,
        rank: row.rank,
        english: row.english,
        korean: row.korean,
        example: row.example,
        datasetVersion: row.datasetVersion,
        sourceType: row.sourceType,
      },
    });
  }

  const total = await prisma.learningItem.count();
  console.log('Seed complete.', { total, counts });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
