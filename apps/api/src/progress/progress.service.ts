import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, startOfTodayInTimezone, toDateOnlyString } from '../study/date.util';

export interface CategoryProgress {
  category: string;
  total: number;
  learned: number;
}

export interface ProgressSummaryResult {
  total: number;
  learned: number;
  due: number;
  today: number;
  categories: CategoryProgress[];
}

export interface CalendarDay {
  date: string;
  count: number;
}

export interface ProgressCalendarResult {
  from: string;
  to: string;
  days: CalendarDay[];
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    return user.timezone;
  }

  async getSummary(userId: string): Promise<ProgressSummaryResult> {
    const timezone = await this.getUserTimezone(userId);
    const todayStart = startOfTodayInTimezone(timezone);
    const dueBefore = addDays(todayStart, 1);

    const [allItems, learnedProgress, dueCount, todayReviewedCount] = await Promise.all([
      this.prisma.learningItem.findMany({ where: { isActive: true }, select: { category: true } }),
      this.prisma.learningProgress.findMany({
        where: { userId, reps: { gt: 0 } },
        include: { learningItem: { select: { category: true } } },
      }),
      this.prisma.learningProgress.count({ where: { userId, dueDate: { lt: dueBefore } } }),
      this.prisma.studyReview.count({
        where: { userId, reviewedAt: { gte: todayStart, lt: addDays(todayStart, 1) } },
      }),
    ]);

    const totalByCategory = new Map<string, number>();
    for (const item of allItems) {
      totalByCategory.set(item.category, (totalByCategory.get(item.category) ?? 0) + 1);
    }

    const learnedByCategory = new Map<string, number>();
    for (const progress of learnedProgress) {
      const category = progress.learningItem.category;
      learnedByCategory.set(category, (learnedByCategory.get(category) ?? 0) + 1);
    }

    const categories: CategoryProgress[] = Array.from(totalByCategory.entries()).map(([category, total]) => ({
      category,
      total,
      learned: learnedByCategory.get(category) ?? 0,
    }));

    return {
      total: allItems.length,
      learned: learnedProgress.length,
      due: dueCount,
      today: todayReviewedCount,
      categories,
    };
  }

  async getCalendar(userId: string, days: number): Promise<ProgressCalendarResult> {
    const timezone = await this.getUserTimezone(userId);
    const todayStart = startOfTodayInTimezone(timezone);
    const rangeStart = addDays(todayStart, -(days - 1));
    const rangeEndExclusive = addDays(todayStart, 1);

    const reviews = await this.prisma.studyReview.findMany({
      where: { userId, reviewedAt: { gte: rangeStart, lt: rangeEndExclusive } },
      select: { reviewedAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      buckets.set(toDateOnlyString(addDays(rangeStart, i)), 0);
    }
    for (const { reviewedAt } of reviews) {
      const dayIndex = Math.floor((reviewedAt.getTime() - rangeStart.getTime()) / 86_400_000);
      const key = toDateOnlyString(addDays(rangeStart, dayIndex));
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return {
      from: toDateOnlyString(rangeStart),
      to: toDateOnlyString(addDays(rangeStart, days - 1)),
      days: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
    };
  }
}
