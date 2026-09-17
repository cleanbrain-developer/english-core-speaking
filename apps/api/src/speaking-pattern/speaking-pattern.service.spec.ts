import { NotFoundException } from '@nestjs/common';
import { SpeakingPatternService } from './speaking-pattern.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SpeakingPatternService.practice', () => {
  function buildService() {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      speakingPatternProgress: { upsert },
      $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
    } as unknown as PrismaService;
    return { service: new SpeakingPatternService(prisma), upsert };
  }

  it('deduplicates repeated ids before upserting', async () => {
    const { service, upsert } = buildService();

    const result = await service.practice('user-1', ['p1', 'p2', 'p2', 'p3', 'p1']);

    expect(upsert).toHaveBeenCalledTimes(3);
    expect(result.practicedCount).toBe(3);
  });

  it('increments practiceCount on repeat practice via the upsert update branch', async () => {
    const { service, upsert } = buildService();

    await service.practice('user-1', ['it-was-difficult-to']);

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_patternId: { userId: 'user-1', patternId: 'it-was-difficult-to' } },
        update: expect.objectContaining({ practiceCount: { increment: 1 } }),
      }),
    );
  });
});

describe('SpeakingPatternService.setFavorite', () => {
  function buildService(patternExists: boolean) {
    const findFirst = jest.fn().mockResolvedValue(patternExists ? { id: 'it-was-difficult-to' } : null);
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      speakingPattern: { findFirst },
      speakingPatternProgress: { upsert },
    } as unknown as PrismaService;
    return { service: new SpeakingPatternService(prisma), upsert, findFirst };
  }

  it('upserts the favorite flag when the pattern exists', async () => {
    const { service, upsert } = buildService(true);

    const result = await service.setFavorite('user-1', 'it-was-difficult-to', true);

    expect(result).toEqual({ favorite: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_patternId: { userId: 'user-1', patternId: 'it-was-difficult-to' } },
        update: { favorite: true },
      }),
    );
  });

  it('throws NotFoundException for a pattern that does not exist (or is inactive)', async () => {
    const { service } = buildService(false);

    await expect(service.setFavorite('user-1', 'missing', true)).rejects.toBeInstanceOf(NotFoundException);
  });
});
