import { describe, expect, it } from 'vitest';

import {
  buildAccessTokenCookieOptions,
  hashRefreshToken,
  isRefreshTokenInactive,
} from '../refresh-token.helpers';

describe('refresh-token.helpers', () => {
  it('hashes refresh tokens deterministically', () => {
    const plainToken = 'refresh-token-value';

    expect(hashRefreshToken(plainToken)).toBe(hashRefreshToken(plainToken));
    expect(hashRefreshToken(plainToken)).not.toBe(plainToken);
  });

  it('marks stale or invalid timestamps as inactive', () => {
    const oldTimestamp = new Date(
      Date.now() - 25 * 60 * 60 * 1000
    ).toISOString();
    const recentTimestamp = new Date(
      Date.now() - 2 * 60 * 60 * 1000
    ).toISOString();

    expect(isRefreshTokenInactive(oldTimestamp)).toBe(true);
    expect(isRefreshTokenInactive('not-a-date')).toBe(true);
    expect(isRefreshTokenInactive(recentTimestamp)).toBe(false);
  });

  it('builds secure access token cookie options', () => {
    const expires = new Date('2030-01-01T00:00:00.000Z');
    const options = buildAccessTokenCookieOptions(expires);

    expect(options).toMatchObject({
      expires,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });
  });
});
