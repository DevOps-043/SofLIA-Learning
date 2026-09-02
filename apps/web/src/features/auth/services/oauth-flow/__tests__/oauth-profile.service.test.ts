import { describe, expect, it } from 'vitest';
import {
  normalizeGoogleOAuthProfile,
  normalizeMicrosoftOAuthProfile,
  normalizeMicrosoftOAuthTokens,
} from '../oauth-profile.service';

describe('oauth-profile.service', () => {
  it('normalizes Google profiles and lowercases the email', () => {
    expect(
      normalizeGoogleOAuthProfile({
        email: 'Ana@example.com',
        family_name: 'Lopez',
        given_name: 'Ana',
        id: 'google-user',
        name: 'Ana Lopez',
        email_verified: true,
      })
    ).toEqual({
      email: 'ana@example.com',
      emailVerified: true,
      firstName: 'Ana',
      fullName: 'Ana Lopez',
      lastName: 'Lopez',
      picture: undefined,
      providerAccountId: 'google-user',
    });
  });

  it('falls back to derived names when Google name fields are missing', () => {
    expect(
      normalizeGoogleOAuthProfile({
        email: 'USER@example.com',
        id: 'google-user',
        name: '',
      })
    ).toEqual({
      email: 'user@example.com',
      emailVerified: undefined,
      firstName: 'Usuario',
      fullName: 'user@example.com',
      lastName: '',
      picture: undefined,
      providerAccountId: 'google-user',
    });
  });

  it('normalizes Microsoft profiles using explicit mail and given names', () => {
    expect(
      normalizeMicrosoftOAuthProfile({
        displayName: 'Mario Casas',
        givenName: 'Mario',
        id: 'ms-user',
        mail: 'Mario@example.com',
        surname: 'Casas',
      })
    ).toEqual({
      email: 'mario@example.com',
      emailVerified: true,
      firstName: 'Mario',
      fullName: 'Mario Casas',
      lastName: 'Casas',
      providerAccountId: 'ms-user',
    });
  });

  it('falls back to principal name and display name for Microsoft profiles', () => {
    expect(
      normalizeMicrosoftOAuthProfile({
        displayName: 'Lucia Herrera',
        id: 'ms-user',
        userPrincipalName: 'lucia@example.com',
      })
    ).toEqual({
      email: 'lucia@example.com',
      emailVerified: true,
      firstName: 'Lucia',
      fullName: 'Lucia Herrera',
      lastName: 'Herrera',
      providerAccountId: 'ms-user',
    });
  });

  it('normalizes Microsoft token expiry into an absolute timestamp', () => {
    const before = Date.now();
    const tokens = normalizeMicrosoftOAuthTokens({
      access_token: 'access-token',
      expires_in: 3600,
      refresh_token: 'refresh-token',
      scope: 'openid profile',
      token_type: 'Bearer',
    });
    const after = Date.now();

    expect(tokens.access_token).toBe('access-token');
    expect(tokens.refresh_token).toBe('refresh-token');
    expect(tokens.scope).toBe('openid profile');
    expect(tokens.token_type).toBe('Bearer');
    expect(tokens.expires_at).toBeGreaterThanOrEqual(before + 3600 * 1000);
    expect(tokens.expires_at).toBeLessThanOrEqual(after + 3600 * 1000);
  });
});
