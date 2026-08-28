import { PrismaClient } from '@prisma/client';
import { seedChunkDrillItems, seedLearningItems } from './seed-data';

function fakePrisma() {
  return {
    learningItem: { upsert: jest.fn().mockResolvedValue({}) },
    chunkItem: { upsert: jest.fn().mockResolvedValue({}) },
  } as unknown as PrismaClient;
}

describe('seedLearningItems', () => {
  it('upserts every canonical row and reports the expected category counts', async () => {
    const prisma = fakePrisma();

    const result = await seedLearningItems(prisma);

    expect(result.total).toBe(1350);
    expect(result.counts).toEqual({
      'Conversation Chunk': 300,
      'Phrasal Verb': 150,
      'Core Word': 700,
      'Work English': 200,
    });
    expect((prisma.learningItem.upsert as jest.Mock)).toHaveBeenCalledTimes(1350);
  });
});

describe('seedChunkDrillItems', () => {
  it('upserts every chunk drill row', async () => {
    const prisma = fakePrisma();

    const result = await seedChunkDrillItems(prisma);

    expect(result.total).toBe(100);
    expect((prisma.chunkItem.upsert as jest.Mock)).toHaveBeenCalledTimes(100);
  });
});
