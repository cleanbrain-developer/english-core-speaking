import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LearningItemsModule } from './learning-items/learning-items.module';
import { StudyModule } from './study/study.module';
import { ProgressModule } from './progress/progress.module';
import { ChunkDrillModule } from './chunk-drill/chunk-drill.module';
import { SpeakingPatternModule } from './speaking-pattern/speaking-pattern.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    // Global per-IP request budget -- this server is a single 2 vCPU/4GB
    // box with no autoscaling, and until this was added there was no
    // protection at all against one client (or a script) hammering the API.
    // Limits are deliberately generous for normal interactive use (loading
    // items, submitting reviews) and tightened per-route where abuse risk
    // is higher (see AuthController's Google OAuth routes).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL_MS', 60_000),
          limit: config.get<number>('THROTTLE_LIMIT', 120),
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    LearningItemsModule,
    StudyModule,
    ProgressModule,
    ChunkDrillModule,
    SpeakingPatternModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
