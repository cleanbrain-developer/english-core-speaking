import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { LearningItem } from '@prisma/client';
import { LearningItemsService } from './learning-items.service';
import { ListLearningItemsDto } from './dto/list-learning-items.dto';

@Controller('learning-items')
export class LearningItemsController {
  constructor(private readonly learningItemsService: LearningItemsService) {}

  @Get()
  list(@Query() query: ListLearningItemsDto): Promise<{ items: LearningItem[]; total: number }> {
    return this.learningItemsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LearningItem> {
    return this.learningItemsService.findById(id);
  }
}
