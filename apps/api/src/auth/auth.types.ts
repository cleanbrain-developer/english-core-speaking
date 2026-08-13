export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  profileImageUrl: string | null;
  timezone: string;
}

export interface SessionTokenPayload {
  sub: string;
}
