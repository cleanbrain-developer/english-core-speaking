import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleProfile } from '../auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      session: false,
    });
  }

  // Called by passport once Google has authenticated the user. Google has
  // already verified this profile server-to-server; the id token / code
  // exchange happens inside the strategy, never on the client.
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google account has no email'), undefined);
      return;
    }

    const googleProfile: GoogleProfile = {
      googleId: profile.id,
      email,
      displayName: profile.displayName,
      profileImageUrl: profile.photos?.[0]?.value,
    };

    done(null, googleProfile);
  }
}
