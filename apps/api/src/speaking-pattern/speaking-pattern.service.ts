import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SpeakingPatternItem,
  SpeakingPatternWithProgress,
  SpeakingIntentSummary,
  summarizeIntents,
  toSpeakingPatternItem,
} from './speaking-pattern.types';

export interface RelatedPatternRef {
  id: string;
  pattern: string;
  koreanMeaning: string;
}

export interface SpeakingPatternDetail extends SpeakingPatternItem {
  relatedPatterns: RelatedPatternRef[];
  contrastPatterns: RelatedPatternRef[];
}

@Injectable()
export class SpeakingPatternService {
  constructor(private readonly prisma: PrismaService) {}

  async listIntents(): Promise<SpeakingIntentSummary[]> {
    const rows = await this.prisma.speakingPattern.findMany({
      where: { isActive: true },
      select: { speakingIntent: true },
    });
    return summarizeIntents(rows);
  }

  async listPatterns(
    userId: string,
    filters: { intent?: string; familyId?: string },
  ): Promise<{ items: SpeakingPatternItem[]; total: number }> {
    const rows = (await this.prisma.speakingPattern.findMany({
      where: {
        isActive: true,
        ...(filters.intent ? { speakingIntent: filters.intent } : {}),
        ...(filters.familyId ? { familyId: filters.familyId } : {}),
      },
      include: { progress: { where: { userId } } },
      orderBy: { rank: 'asc' },
    })) as SpeakingPatternWithProgress[];

    const items = rows.map(toSpeakingPatternItem);
    return { items, total: items.length };
  }

  async getPattern(userId: string, id: string): Promise<SpeakingPatternDetail> {
    const row = (await this.prisma.speakingPattern.findFirst({
      where: { id, isActive: true },
      include: { progress: { where: { userId } } },
    })) as SpeakingPatternWithProgress | null;
    if (!row) throw new NotFoundException(`Speaking pattern ${id} not found`);

    const item = toSpeakingPatternItem(row);
    const refIds = [...item.relatedPatternIds, ...item.contrastPatternIds];
    const refs =
      refIds.length === 0
        ? []
        : await this.prisma.speakingPattern.findMany({
            where: { id: { in: refIds } },
            select: { id: true, pattern: true, koreanMeaning: true },
          });
    const refById = new Map(refs.map((r) => [r.id, r]));

    return {
      ...item,
      relatedPatterns: item.relatedPatternIds.map((rid) => refById.get(rid)).filter((r): r is RelatedPatternRef => !!r),
      contrastPatterns: item.contrastPatternIds
        .map((rid) => refById.get(rid))
        .filter((r): r is RelatedPatternRef => !!r),
    };
  }

  async practice(userId: string, patternIds: string[]): Promise<{ practicedCount: number }> {
    const uniqueIds = Array.from(new Set(patternIds));
    const now = new Date();

    await this.prisma.$transaction(
      uniqueIds.map((patternId) =>
        this.prisma.speakingPatternProgress.upsert({
          where: { userId_patternId: { userId, patternId } },
          create: { userId, patternId, practiceCount: 1, lastPracticedAt: now },
          update: { practiceCount: { increment: 1 }, lastPracticedAt: now },
        }),
      ),
    );

    return { practicedCount: uniqueIds.length };
  }

  async setFavorite(userId: string, patternId: string, favorite: boolean): Promise<{ favorite: boolean }> {
    const pattern = await this.prisma.speakingPattern.findFirst({ where: { id: patternId, isActive: true } });
    if (!pattern) throw new NotFoundException(`Speaking pattern ${patternId} not found`);

    await this.prisma.speakingPatternProgress.upsert({
      where: { userId_patternId: { userId, patternId } },
      create: { userId, patternId, favorite },
      update: { favorite },
    });

    return { favorite };
  }
}
