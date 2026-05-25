import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  applyCorsHeaders,
  enforceCors,
  getEffectiveAllowedOrigins,
  isOriginAllowed,
} from '../cors';

const ORIGINAL_ENV = { ...process.env };

function buildRequest(
  url: string,
  init: { method?: string; headers?: Record<string, string> } = {},
): NextRequest {
  return new NextRequest(url, {
    method: init.method ?? 'GET',
    headers: init.headers ?? {},
  });
}

describe('cors', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.WEB_ALLOWED_ORIGINS = 'https://app.soflia.com,https://*.soflia.com';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('isOriginAllowed', () => {
    it('accepts exact match', () => {
      expect(isOriginAllowed('https://app.soflia.com')).toBe(true);
    });

    it('accepts wildcard subdomain match', () => {
      expect(isOriginAllowed('https://acme.soflia.com')).toBe(true);
    });

    it('rejects unknown origin', () => {
      expect(isOriginAllowed('https://evil.com')).toBe(false);
    });

    it('rejects null origin', () => {
      expect(isOriginAllowed(null)).toBe(false);
    });
  });

  describe('getEffectiveAllowedOrigins', () => {
    it('returns localhost defaults in development when nothing configured', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.WEB_ALLOWED_ORIGINS;
      delete process.env.ALLOWED_ORIGINS;
      expect(getEffectiveAllowedOrigins()).toContain('http://localhost:3000');
    });

    it('returns empty list in production when nothing configured', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.WEB_ALLOWED_ORIGINS;
      delete process.env.ALLOWED_ORIGINS;
      expect(getEffectiveAllowedOrigins()).toEqual([]);
    });
  });

  describe('enforceCors', () => {
    it('returns null for non-api paths', () => {
      const request = buildRequest('http://example.com/dashboard');
      expect(enforceCors(request)).toBeNull();
    });

    it('returns null for same-origin api requests', () => {
      const request = buildRequest('http://example.com/api/me', {
        headers: { origin: 'http://example.com', host: 'example.com' },
      });
      expect(enforceCors(request)).toBeNull();
    });

    it('returns 403 for cross-origin api request from disallowed origin', () => {
      const request = buildRequest('http://example.com/api/me', {
        headers: { origin: 'https://evil.com', host: 'example.com' },
      });
      const response = enforceCors(request);
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(403);
    });

    it('returns 204 with CORS headers for preflight from allowed origin', () => {
      const request = buildRequest('http://example.com/api/me', {
        method: 'OPTIONS',
        headers: { origin: 'https://app.soflia.com', host: 'example.com' },
      });
      const response = enforceCors(request);
      expect(response?.status).toBe(204);
      expect(response?.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://app.soflia.com',
      );
      expect(response?.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(response?.headers.get('Access-Control-Max-Age')).toBe('600');
    });

    it('returns null for cross-origin non-preflight from allowed origin (lets handler run)', () => {
      const request = buildRequest('http://example.com/api/me', {
        headers: { origin: 'https://app.soflia.com', host: 'example.com' },
      });
      expect(enforceCors(request)).toBeNull();
    });
  });

  describe('applyCorsHeaders', () => {
    it('does not add headers when origin missing', () => {
      const request = buildRequest('http://example.com/api/me');
      const response = NextResponse.json({ ok: true });
      const out = applyCorsHeaders(response, request);
      expect(out.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('does not add headers for same-origin', () => {
      const request = buildRequest('http://example.com/api/me', {
        headers: { origin: 'http://example.com', host: 'example.com' },
      });
      const response = NextResponse.json({ ok: true });
      const out = applyCorsHeaders(response, request);
      expect(out.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('adds headers for cross-origin from allowed origin', () => {
      const request = buildRequest('http://example.com/api/me', {
        headers: { origin: 'https://app.soflia.com', host: 'example.com' },
      });
      const response = NextResponse.json({ ok: true });
      const out = applyCorsHeaders(response, request);
      expect(out.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://app.soflia.com',
      );
      expect(out.headers.get('Vary')).toBe('Origin');
    });

    it('does not add headers when origin not allowed', () => {
      const request = buildRequest('http://example.com/api/me', {
        headers: { origin: 'https://evil.com', host: 'example.com' },
      });
      const response = NextResponse.json({ ok: true });
      const out = applyCorsHeaders(response, request);
      expect(out.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });
});
