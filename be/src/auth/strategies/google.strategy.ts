import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    console.log({
      clientId: process.env.GOOGLE_CLIENT_ID,

      callback: process.env.GOOGLE_CALLBACK_URL,
    });
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? 'missing-google-client-id',
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ?? 'missing-google-client-secret',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:8080/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; displayName: string; emails?: { value: string }[] },
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google account does not expose an email'));
    }

    const authResult = await this.authService.validateOAuthUser({
      email,
      name: profile.displayName,
      provider: 'google',
      providerId: profile.id,
    });

    done(null, authResult);
  }
}
