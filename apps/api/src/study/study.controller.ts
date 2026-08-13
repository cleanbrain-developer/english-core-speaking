import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { StudyService } from './study.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueueQueryDto } from './dto/queue-query.dto';

@Controller('study')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Get('daily')
  getDaily(@CurrentUser() user: AuthenticatedUser, @Query() query: QueueQueryDto) {
    return this.studyService.getDailyQueue(user.id, query.limit ?? 30);
  }

  @Get('due')
  getDue(@CurrentUser() user: AuthenticatedUser, @Query() query: QueueQueryDto) {
    return this.studyService.getDueQueue(user.id, query.limit ?? 30);
  }

  @Get('new')
  getNew(@CurrentUser() user: AuthenticatedUser, @Query() query: QueueQueryDto) {
    return this.studyService.getNewQueue(user.id, query.limit ?? 30);
  }

  @Get('weak')
  getWeak(@CurrentUser() user: AuthenticatedUser, @Query() query: QueueQueryDto) {
    return this.studyService.getWeakQueue(user.id, query.limit ?? 30);
  }

  @Post('sessions')
  createSession(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSessionDto) {
    return this.studyService.createSession(user.id, dto.mode);
  }

  @Patch('sessions/:id/finish')
  finishSession(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studyService.finishSession(user.id, id);
  }

  @Post('reviews')
  createReview(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto) {
    return this.studyService.createReview(user.id, dto);
  }
}
