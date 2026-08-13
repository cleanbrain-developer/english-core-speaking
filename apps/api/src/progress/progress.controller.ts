import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { ProgressService } from './progress.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.progressService.getSummary(user.id);
  }

  @Get('calendar')
  getCalendar(@CurrentUser() user: AuthenticatedUser, @Query() query: CalendarQueryDto) {
    return this.progressService.getCalendar(user.id, query.days ?? 30);
  }
}
