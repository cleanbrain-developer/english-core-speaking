import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { SessionTokenService } from './session-token.service';

describe('SessionTokenService', () => {
  const config = { getOrThrow: () => 'test-session-secret' } as unknown as ConfigService;
  const service = new SessionTokenService(config);

  it('signs a token that verifies back to the same user id', () => {
    const token = service.sign('user-123');
    const payload = service.verify(token);
    expect(payload.sub).toBe('user-123');
  });

  it('rejects a tampered token', () => {
    const token = service.sign('user-123');
    expect(() => service.verify(token + 'tampered')).toThrow(UnauthorizedException);
  });

  it('rejects a token signed with a different secret', () => {
    const otherConfig = { getOrThrow: () => 'a-different-secret' } as unknown as ConfigService;
    const otherService = new SessionTokenService(otherConfig);
    const token = otherService.sign('user-123');
    expect(() => service.verify(token)).toThrow(UnauthorizedException);
  });
});
