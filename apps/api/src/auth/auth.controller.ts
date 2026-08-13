import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser, GoogleProfile } from './auth.types';
import { SessionTokenService } from './session-token.service';
import { SESSION_COOKIE_NAME } from './guards/session-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionTokenService: SessionTokenService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(): void {
    // Redirect to Google is handled entirely by passport-google-oauth20.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const profile = req.user as GoogleProfile;
    const user = await this.usersService.findOrCreateFromGoogle(profile);
    const token = this.sessionTokenService.sign(user.id);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.redirect(this.config.get<string>('FRONTEND_ORIGIN', 'http://localhost:5173'));
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { success: true } {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return { success: true };
  }
}
