import { Module } from '@nestjs/common';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';
import { REVIEW_SCHEDULER } from './scheduler/scheduler.types';
import { SrsV1Scheduler } from './scheduler/srs-v1.scheduler';

@Module({
  controllers: [StudyController],
  providers: [
    StudyService,
    {
      provide: REVIEW_SCHEDULER,
      useClass: SrsV1Scheduler,
    },
  ],
})
export class StudyModule {}
