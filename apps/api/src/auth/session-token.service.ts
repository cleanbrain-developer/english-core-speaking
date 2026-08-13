import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { SessionTokenPayload } from './auth.types';

const SESSION_TTL = '30d';

@Injectable()
export class SessionTokenService {
  constructor(private readonly config: ConfigService) {}

  sign(userId: string): string {
    const secret = this.config.getOrThrow<string>('SESSION_SECRET');
    return jwt.sign({ sub: userId } satisfies SessionTokenPayload, secret, {
      expiresIn: SESSION_TTL,
    });
  }

  verify(token: string): SessionTokenPayload {
    const secret = this.config.getOrThrow<string>('SESSION_SECRET');
    try {
      return jwt.verify(token, secret) as SessionTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
