import { Injectable, NotFoundException } from '@nestjs/common';
import { LearningItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListLearningItemsDto } from './dto/list-learning-items.dto';

@Injectable()
export class LearningItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListLearningItemsDto): Promise<{ items: LearningItem[]; total: number }> {
    const where: Prisma.LearningItemWhereInput = {
      isActive: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.search
        ? {
            OR: [
              { english: { contains: query.search, mode: 'insensitive' } },
              { korean: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.learningItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { rank: 'asc' }],
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.learningItem.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: number): Promise<LearningItem> {
    const item = await this.prisma.learningItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Learning item ${id} not found`);
    return item;
  }
}
