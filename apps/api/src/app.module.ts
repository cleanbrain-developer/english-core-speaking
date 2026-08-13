import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LearningItemsModule } from './learning-items/learning-items.module';
import { StudyModule } from './study/study.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    LearningItemsModule,
    StudyModule,
    ProgressModule,
  ],
})
export class AppModule {}
