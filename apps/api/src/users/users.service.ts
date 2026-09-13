import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleProfile } from '../auth/auth.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Finds the user by Google `sub`, or creates one on first login. Never matches on email alone. */
  async findOrCreateFromGoogle(profile: GoogleProfile): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          email: profile.email,
          displayName: profile.displayName ?? existing.displayName,
          profileImageUrl: profile.profileImageUrl ?? existing.profileImageUrl,
          lastLoginAt: new Date(),
        },
      });
    }

    return this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        displayName: profile.displayName,
        profileImageUrl: profile.profileImageUrl,
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Permanently deletes the user and all owned data. Every user-scoped
   * table (progress, sessions, reviews, chunk drill progress) has
   * `onDelete: Cascade` back to User in the schema, so this one delete is
   * sufficient -- no other cleanup is needed.
   */
  async deleteById(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
