import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { seedChunkDrillItems, seedLearningItems } from './seed-data';

/**
 * Injects the canonical seed data on every app boot (fresh install, redeploy,
 * or crash-restart) so no separate manual seed step is needed. Safe to run
 * repeatedly: both seed functions upsert by canonical id.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    const learningItems = await seedLearningItems(this.prisma);
    this.logger.log(`Learning item seed complete: ${learningItems.total} rows`);

    const chunkDrillItems = await seedChunkDrillItems(this.prisma);
    this.logger.log(`Chunk drill seed complete: ${chunkDrillItems.total} rows`);
  }
}
