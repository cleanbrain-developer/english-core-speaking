import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard, SESSION_COOKIE_NAME } from './session-auth.guard';
import { SessionTokenService } from '../session-token.service';
import { UsersService } from '../../users/users.service';

function buildContext(cookies: Record<string, string>): ExecutionContext {
  const request: any = { cookies };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('SessionAuthGuard', () => {
  const user = {
    id: 'user-1',
    email: 'a@example.com',
    displayName: 'A',
    profileImageUrl: null,
    timezone: 'Asia/Seoul',
  };

  function buildGuard(isPublic: boolean) {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(isPublic) } as unknown as Reflector;
    const sessionTokenService = {
      verify: jest.fn().mockReturnValue({ sub: user.id }),
    } as unknown as SessionTokenService;
    const usersService = {
      findById: jest.fn().mockResolvedValue(user),
    } as unknown as UsersService;
    return { guard: new SessionAuthGuard(reflector, sessionTokenService, usersService), sessionTokenService, usersService };
  }

  it('allows public routes without a session cookie', async () => {
    const { guard } = buildGuard(true);
    const context = buildContext({});
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects protected routes with no session cookie', async () => {
    const { guard } = buildGuard(false);
    const context = buildContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the resolved user and allows access with a valid cookie', async () => {
    const { guard } = buildGuard(false);
    const context = buildContext({ [SESSION_COOKIE_NAME]: 'valid-token' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    const request = context.switchToHttp().getRequest<any>();
    expect(request.user).toEqual(user);
  });

  it('rejects when the session references a user that no longer exists', async () => {
    const { guard, usersService } = buildGuard(false);
    (usersService.findById as jest.Mock).mockResolvedValueOnce(null);
    const context = buildContext({ [SESSION_COOKIE_NAME]: 'valid-token' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
