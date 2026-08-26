import { ChunkDrillService } from './chunk-drill.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChunkDrillService.completeDrill', () => {
  function buildService() {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      chunkDrillProgress: { upsert },
      $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
    } as unknown as PrismaService;
    return { service: new ChunkDrillService(prisma), upsert };
  }

  it('deduplicates repeated ids before upserting', async () => {
    const { service, upsert } = buildService();

    const result = await service.completeDrill('user-1', [1, 2, 2, 3, 1]);

    expect(upsert).toHaveBeenCalledTimes(3);
    expect(result.practicedCount).toBe(3);
  });

  it('increments practiceCount on repeat practice via the upsert update branch', async () => {
    const { service, upsert } = buildService();

    await service.completeDrill('user-1', [7]);

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_chunkItemId: { userId: 'user-1', chunkItemId: 7 } },
        update: expect.objectContaining({ practiceCount: { increment: 1 } }),
      }),
    );
  });
});
