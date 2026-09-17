import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { SpeakingPatternService } from './speaking-pattern.service';
import { ListPatternsDto } from './dto/list-patterns.dto';
import { PracticePatternsDto } from './dto/practice-patterns.dto';
import { SetFavoriteDto } from './dto/set-favorite.dto';

@Controller('speaking-patterns')
export class SpeakingPatternController {
  constructor(private readonly speakingPatternService: SpeakingPatternService) {}

  @Get('intents')
  getIntents() {
    return this.speakingPatternService.listIntents();
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListPatternsDto) {
    return this.speakingPatternService.listPatterns(user.id, { intent: query.intent, familyId: query.familyId });
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.speakingPatternService.getPattern(user.id, id);
  }

  @Post('practice')
  practice(@CurrentUser() user: AuthenticatedUser, @Body() dto: PracticePatternsDto) {
    return this.speakingPatternService.practice(user.id, dto.patternIds);
  }

  @Post(':id/favorite')
  setFavorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SetFavoriteDto) {
    return this.speakingPatternService.setFavorite(user.id, id, dto.favorite);
  }
}
