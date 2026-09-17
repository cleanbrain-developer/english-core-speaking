import { PrismaClient } from '@prisma/client';
import { seedChunkDrillItems, seedLearningItems, seedSpeakingPatterns } from './seed-data';

function fakePrisma() {
  return {
    learningItem: { upsert: jest.fn().mockResolvedValue({}) },
    chunkItem: { upsert: jest.fn().mockResolvedValue({}) },
    speakingPattern: { upsert: jest.fn().mockResolvedValue({}) },
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

describe('seedSpeakingPatterns', () => {
  it('upserts every canonical row and reports per-family counts', async () => {
    const prisma = fakePrisma();

    const result = await seedSpeakingPatterns(prisma);

    expect(result.total).toBe(70);
    expect(result.families).toEqual({
      'it-was': 21,
      'i-think': 4,
      'the-problem-is': 3,
      'there-was': 4,
      'i-was': 4,
      'im-trying-to': 5,
      'i-need-to': 4,
      'i-want-to': 3,
      'the-reason-is': 3,
      'i-used-to': 3,
      'ive-been': 3,
      'it-seems-like': 3,
      'im-not-sure-if': 4,
      'for-example': 3,
      'the-thing-is': 3,
    });
    expect((prisma.speakingPattern.upsert as jest.Mock)).toHaveBeenCalledTimes(70);
  });
});
