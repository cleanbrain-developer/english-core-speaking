import { Module } from '@nestjs/common';
import { SpeakingPatternController } from './speaking-pattern.controller';
import { SpeakingPatternService } from './speaking-pattern.service';

@Module({
  controllers: [SpeakingPatternController],
  providers: [SpeakingPatternService],
})
export class SpeakingPatternModule {}
