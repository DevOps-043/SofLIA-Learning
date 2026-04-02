import * as crypto from 'crypto';

import { SECURE_COOKIE_OPTIONS } from './cookie-config';

export const ACCESS_TOKEN_EXPIRY_MS = 30 * 60 * 1000;
export const REFRESH_TOKEN_MAX_INACTIVITY_HOURS = 24;

function getRefreshTokenLifetimeMs(rememberMe: boolean): number {
  return (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createAccessTokenExpiry(now: number = Date.now()): Date {
  return new Date(now + ACCESS_TOKEN_EXPIRY_MS);
}

export function createRefreshTokenExpiry(
  rememberMe: boolean,
  now: number = Date.now()
): Date {
  return new Date(now + getRefreshTokenLifetimeMs(rememberMe));
}

export function getDeviceFingerprint(request?: Request): string {
  if (!request) {
    return 'unknown';
  }

  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';

  return hashRefreshToken(
    `${userAgent}|${acceptLanguage}|${acceptEncoding}`
  );
}

export function getIpAddress(request?: Request): string {
  if (!request) {
    return 'unknown';
  }

  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function isRefreshTokenInactive(
  lastUsedAt: string,
  now: number = Date.now()
): boolean {
  const lastUsedAtMs = new Date(lastUsedAt).getTime();

  if (Number.isNaN(lastUsedAtMs)) {
    return true;
  }

  const hoursSinceLastUse = (now - lastUsedAtMs) / (1000 * 60 * 60);
  return hoursSinceLastUse > REFRESH_TOKEN_MAX_INACTIVITY_HOURS;
}

export function buildAccessTokenCookieOptions(expires: Date) {
  return {
    ...SECURE_COOKIE_OPTIONS,
    expires,
  };
}
