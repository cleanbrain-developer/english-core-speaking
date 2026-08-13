import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { SessionTokenService } from './session-token.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'google', session: false }), UsersModule],
  controllers: [AuthController],
  providers: [
    GoogleStrategy,
    SessionTokenService,
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
  ],
  exports: [SessionTokenService],
})
export class AuthModule {}
