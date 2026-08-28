import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Shared by the app's own startup seeding (seed.service.ts, runs on every
// boot) and the standalone `pnpm seed` script (prisma/seed.ts) so the two
// never drift. data/ sits at the repo root; from this file's compiled
// location (apps/api/dist/prisma/) that's four levels up.
const DATA_DIR = join(__dirname, '..', '..', '..', '..', 'data');

interface LearningItemRow {
  id: number;
  category: string;
  english: string;
  korean: string;
  example: string;
  rank: number;
  datasetVersion: string;
  sourceType: string;
}

interface ChunkDrillRow {
  id: number;
  rank: number;
  english: string;
  korean: string;
  example: string;
}

const EXPECTED_LEARNING_ITEM_COUNTS: Record<string, number> = {
  'Conversation Chunk': 300,
  'Phrasal Verb': 150,
  'Core Word': 700,
  'Work English': 200,
};

const EXPECTED_CHUNK_DRILL_COUNT = 100;

export interface LearningItemSeedResult {
  total: number;
  counts: Record<string, number>;
}

export interface ChunkDrillSeedResult {
  total: number;
}

export async function seedLearningItems(prisma: PrismaClient): Promise<LearningItemSeedResult> {
  const seedPath = join(DATA_DIR, 'speaking_core_1350_seed_v2.json');
  const rows: LearningItemRow[] = JSON.parse(readFileSync(seedPath, 'utf-8'));

  if (rows.length !== 1350) {
    throw new Error(`Expected 1350 seed rows, found ${rows.length}`);
  }

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.category] = (counts[row.category] ?? 0) + 1;
  for (const [category, expected] of Object.entries(EXPECTED_LEARNING_ITEM_COUNTS)) {
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

  return { total: rows.length, counts };
}

export async function seedChunkDrillItems(prisma: PrismaClient): Promise<ChunkDrillSeedResult> {
  const seedPath = join(DATA_DIR, 'chunk_drill_v1.json');
  const rows: ChunkDrillRow[] = JSON.parse(readFileSync(seedPath, 'utf-8'));

  if (rows.length !== EXPECTED_CHUNK_DRILL_COUNT) {
    throw new Error(`Expected ${EXPECTED_CHUNK_DRILL_COUNT} chunk drill rows, found ${rows.length}`);
  }

  for (const row of rows) {
    await prisma.chunkItem.upsert({
      where: { id: row.id },
      create: { id: row.id, rank: row.rank, english: row.english, korean: row.korean, example: row.example },
      update: { rank: row.rank, english: row.english, korean: row.korean, example: row.example },
    });
  }

  return { total: rows.length };
}
