import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfTodayInTimezone, addDays } from '../study/date.util';
import { ChunkDrillItem, ChunkItemWithProgress, sortByDrillPriority, toChunkDrillItem } from './chunk-drill.types';

export interface ChunkDrillSummary {
  total: number;
  practicedAtLeastOnce: number;
  practicedToday: number;
}

@Injectable()
export class ChunkDrillService {
  constructor(private readonly prisma: PrismaService) {}

  async getDrillSet(userId: string, size: number): Promise<{ items: ChunkDrillItem[]; total: number }> {
    const items = (await this.prisma.chunkItem.findMany({
      where: { isActive: true },
      include: { progress: { where: { userId } } },
    })) as ChunkItemWithProgress[];

    const ordered = sortByDrillPriority(items.map(toChunkDrillItem)).slice(0, size);
    return { items: ordered, total: items.length };
  }

  async completeDrill(userId: string, chunkItemIds: number[]): Promise<{ practicedCount: number }> {
    const uniqueIds = Array.from(new Set(chunkItemIds));
    const now = new Date();

    await this.prisma.$transaction(
      uniqueIds.map((chunkItemId) =>
        this.prisma.chunkDrillProgress.upsert({
          where: { userId_chunkItemId: { userId, chunkItemId } },
          create: { userId, chunkItemId, practiceCount: 1, lastPracticedAt: now },
          update: { practiceCount: { increment: 1 }, lastPracticedAt: now },
        }),
      ),
    );

    return { practicedCount: uniqueIds.length };
  }

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    return user.timezone;
  }

  async getSummary(userId: string): Promise<ChunkDrillSummary> {
    const timezone = await this.getUserTimezone(userId);
    const todayStart = startOfTodayInTimezone(timezone);
    const tomorrowStart = addDays(todayStart, 1);

    const [total, practicedAtLeastOnce, practicedToday] = await Promise.all([
      this.prisma.chunkItem.count({ where: { isActive: true } }),
      this.prisma.chunkDrillProgress.count({ where: { userId, practiceCount: { gt: 0 } } }),
      this.prisma.chunkDrillProgress.count({
        where: { userId, lastPracticedAt: { gte: todayStart, lt: tomorrowStart } },
      }),
    ]);

    return { total, practicedAtLeastOnce, practicedToday };
  }
}
