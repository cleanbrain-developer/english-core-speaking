import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionTokenService } from '../session-token.service';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../auth.types';

export const SESSION_COOKIE_NAME = 'sc_session';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionTokenService: SessionTokenService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = request.cookies?.[SESSION_COOKIE_NAME];
    if (!token) throw new UnauthorizedException('Not authenticated');

    const payload = this.sessionTokenService.verify(token);
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Not authenticated');

    request.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
      timezone: user.timezone,
    };
    return true;
  }
}
