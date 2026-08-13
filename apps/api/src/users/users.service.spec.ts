import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleProfile } from '../auth/auth.types';

describe('UsersService', () => {
  const profile: GoogleProfile = {
    googleId: 'google-sub-1',
    email: 'user@example.com',
    displayName: 'User Name',
    profileImageUrl: 'https://example.com/photo.jpg',
  };

  function buildService(existing: any) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'new-id', ...data })),
        update: jest.fn().mockImplementation(({ data }) => ({ id: existing?.id, ...existing, ...data })),
      },
    } as unknown as PrismaService;
    return { service: new UsersService(prisma), prisma };
  }

  it('creates a new user keyed by googleId on first login', async () => {
    const { service, prisma } = buildService(null);
    const user = await service.findOrCreateFromGoogle(profile);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ googleId: profile.googleId, email: profile.email }) }),
    );
    expect(user).toMatchObject({ googleId: profile.googleId, email: profile.email });
  });

  it('reuses the existing user by googleId and refreshes profile fields on return login', async () => {
    const existing = {
      id: 'existing-id',
      googleId: profile.googleId,
      email: 'old@example.com',
      displayName: 'Old Name',
      profileImageUrl: null,
    };
    const { service, prisma } = buildService(existing);

    await service.findOrCreateFromGoogle(profile);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { googleId: profile.googleId } });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: existing.id },
        data: expect.objectContaining({ email: profile.email, displayName: profile.displayName }),
      }),
    );
  });
});
