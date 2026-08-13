import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StudySession } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, startOfTodayInTimezone, toDateOnlyString } from './date.util';
import { CreateReviewDto } from './dto/create-review.dto';
import { StudyMode } from './dto/create-session.dto';
import { REVIEW_SCHEDULER, ReviewScheduler, SchedulerState } from './scheduler/scheduler.types';
import { QueueItem, toQueueItem } from './study.types';

export interface ReviewResult {
  learningItemId: number;
  rating: number;
  reps: number;
  lapses: number;
  ease: number;
  intervalDays: number;
  dueDate: string;
}

const NEW_CARD_STATE: SchedulerState = { reps: 0, ease: 2.5, intervalDays: 0, lapses: 0 };

@Injectable()
export class StudyService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REVIEW_SCHEDULER) private readonly scheduler: ReviewScheduler,
  ) {}

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    return user.timezone;
  }

  async getDailyQueue(userId: string, limit: number): Promise<{ items: QueueItem[]; total: number }> {
    const timezone = await this.getUserTimezone(userId);
    const dueBefore = addDays(startOfTodayInTimezone(timezone), 1);

    const dueProgress = await this.prisma.learningProgress.findMany({
      where: { userId, dueDate: { lt: dueBefore } },
      include: { learningItem: true },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });

    const remaining = limit - dueProgress.length;
    const unseen =
      remaining > 0
        ? await this.prisma.learningItem.findMany({
            where: { isActive: true, progress: { none: { userId } } },
            orderBy: [{ category: 'asc' }, { rank: 'asc' }],
            take: remaining,
          })
        : [];

    const items: QueueItem[] = [
      ...dueProgress.map((p) => toQueueItem(p.learningItem, p)),
      ...unseen.map((item) => toQueueItem(item, null)),
    ];
    return { items, total: items.length };
  }

  async getDueQueue(userId: string, limit: number): Promise<{ items: QueueItem[]; total: number }> {
    const timezone = await this.getUserTimezone(userId);
    const dueBefore = addDays(startOfTodayInTimezone(timezone), 1);

    const progress = await this.prisma.learningProgress.findMany({
      where: { userId, dueDate: { lt: dueBefore } },
      include: { learningItem: true },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });
    const items = progress.map((p) => toQueueItem(p.learningItem, p));
    return { items, total: items.length };
  }

  async getNewQueue(userId: string, limit: number): Promise<{ items: QueueItem[]; total: number }> {
    const unseen = await this.prisma.learningItem.findMany({
      where: { isActive: true, progress: { none: { userId } } },
      orderBy: [{ category: 'asc' }, { rank: 'asc' }],
      take: limit,
    });
    const items = unseen.map((item) => toQueueItem(item, null));
    return { items, total: items.length };
  }

  /** Assumption: "weak" = at least one lapse ever, or ease has drifted to <=2.1. */
  async getWeakQueue(userId: string, limit: number): Promise<{ items: QueueItem[]; total: number }> {
    const progress = await this.prisma.learningProgress.findMany({
      where: { userId, OR: [{ lapses: { gte: 1 } }, { ease: { lte: 2.1 } }] },
      include: { learningItem: true },
      orderBy: { ease: 'asc' },
      take: limit,
    });
    const items = progress.map((p) => toQueueItem(p.learningItem, p));
    return { items, total: items.length };
  }

  createSession(userId: string, mode: StudyMode): Promise<StudySession> {
    return this.prisma.studySession.create({ data: { userId, mode } });
  }

  async finishSession(userId: string, sessionId: string): Promise<StudySession> {
    const session = await this.findOwnedSession(userId, sessionId);
    return this.prisma.studySession.update({
      where: { id: session.id },
      data: { endedAt: new Date() },
    });
  }

  async createReview(userId: string, dto: CreateReviewDto): Promise<ReviewResult> {
    await this.findOwnedSession(userId, dto.sessionId);

    const item = await this.prisma.learningItem.findUnique({ where: { id: dto.learningItemId } });
    if (!item) throw new NotFoundException(`Learning item ${dto.learningItemId} not found`);

    const timezone = await this.getUserTimezone(userId);
    const existing = await this.prisma.learningProgress.findUnique({
      where: { userId_learningItemId: { userId, learningItemId: dto.learningItemId } },
    });

    const previousState: SchedulerState = existing
      ? {
          reps: existing.reps,
          ease: existing.ease,
          intervalDays: existing.intervalDays,
          lapses: existing.lapses,
        }
      : NEW_CARD_STATE;

    const nextState = this.scheduler.computeNext(previousState, dto.rating);
    const dueDate = addDays(startOfTodayInTimezone(timezone), nextState.intervalDays);
    const now = new Date();

    const [progress] = await this.prisma.$transaction([
      this.prisma.learningProgress.upsert({
        where: { userId_learningItemId: { userId, learningItemId: dto.learningItemId } },
        create: {
          userId,
          learningItemId: dto.learningItemId,
          reps: nextState.reps,
          ease: nextState.ease,
          intervalDays: nextState.intervalDays,
          lapses: nextState.lapses,
          dueDate,
          lastReviewedAt: now,
        },
        update: {
          reps: nextState.reps,
          ease: nextState.ease,
          intervalDays: nextState.intervalDays,
          lapses: nextState.lapses,
          dueDate,
          lastReviewedAt: now,
        },
      }),
      this.prisma.studyReview.create({
        data: {
          sessionId: dto.sessionId,
          userId,
          learningItemId: dto.learningItemId,
          rating: dto.rating,
          previousInterval: previousState.intervalDays,
          nextInterval: nextState.intervalDays,
          previousEase: previousState.ease,
          nextEase: nextState.ease,
        },
      }),
      this.prisma.studySession.update({
        where: { id: dto.sessionId },
        data: { reviewedCount: { increment: 1 } },
      }),
    ]);

    return {
      learningItemId: dto.learningItemId,
      rating: dto.rating,
      reps: progress.reps,
      lapses: progress.lapses,
      ease: progress.ease,
      intervalDays: progress.intervalDays,
      dueDate: toDateOnlyString(progress.dueDate as Date),
    };
  }

  private async findOwnedSession(userId: string, sessionId: string): Promise<StudySession> {
    const session = await this.prisma.studySession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new NotFoundException(`Study session ${sessionId} not found`);
    }
    return session;
  }
}
