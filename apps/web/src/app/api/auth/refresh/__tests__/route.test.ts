import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { RefreshTokenError } from '@/lib/auth/refresh-token.errors';

const { refreshSessionMock } = vi.hoisted(() => ({
  refreshSessionMock: vi.fn(),
}));

vi.mock('@/lib/auth/refreshToken.service', () => ({
  RefreshTokenService: {
    refreshSession: refreshSessionMock,
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));

import { GET, POST } from '../route';

function createRequest(method: 'GET' | 'POST', cookieHeader?: string) {
  return new NextRequest('http://localhost:3000/api/auth/refresh', {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    method,
  });
}

describe('/api/auth/refresh route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the next access token expiry on POST success', async () => {
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');

    refreshSessionMock.mockResolvedValue({
      accessExpiresAt: expiresAt,
      accessToken: 'access-token',
      refreshExpiresAt: new Date('2030-01-08T00:00:00.000Z'),
      userId: 'user-1',
    });

    const response = await POST(createRequest('POST', 'refresh_token=token'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      expiresAt: expiresAt.toISOString(),
      success: true,
    });
  });

  it('returns 401 and clears cookies for auth refresh errors', async () => {
    refreshSessionMock.mockRejectedValue(
      new RefreshTokenError('INVALID_REFRESH_TOKEN')
    );

    const response = await POST(createRequest('POST', 'refresh_token=token'));
    const payload = await response.json();
    const setCookieHeader = response.headers.get('set-cookie') || '';

    expect(response.status).toBe(401);
    expect(payload.code).toBe('SESSION_EXPIRED');
    expect(setCookieHeader).toContain('access_token=');
    expect(setCookieHeader).toContain('refresh_token=');
  });

  it('returns authenticated session state on GET when refresh succeeds', async () => {
    const accessExpiresAt = new Date('2030-01-01T00:00:00.000Z');
    const refreshExpiresAt = new Date('2030-01-08T00:00:00.000Z');

    refreshSessionMock.mockResolvedValue({
      accessExpiresAt,
      accessToken: 'access-token',
      refreshExpiresAt,
      userId: 'user-1',
    });

    const response = await GET(
      createRequest('GET', 'access_token=a; refresh_token=b')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      accessExpiresAt: accessExpiresAt.toISOString(),
      authenticated: true,
      refreshExpiresAt: refreshExpiresAt.toISOString(),
      success: true,
      userId: 'user-1',
    });
  });
});
