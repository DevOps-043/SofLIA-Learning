import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { RefreshTokenError } from '@/lib/auth/refresh-token.errors';
import { clearRateLimitCache } from '@/lib/rate-limit/advanced-rate-limit';

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
    clearRateLimitCache();
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
    expect(payload).toMatchObject({
      error: 'SESSION_EXPIRED',
      message: 'Sesión expirada.',
    });
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

  it('returns unauthenticated state on GET when no session cookies exist', async () => {
    const response = await GET(createRequest('GET'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      authenticated: false,
      message: 'No hay sesion activa',
      success: false,
    });
  });

  it('clears cookies on GET when the refresh token is invalid', async () => {
    refreshSessionMock.mockRejectedValue(
      new RefreshTokenError('INVALID_REFRESH_TOKEN')
    );

    const response = await GET(
      createRequest('GET', 'access_token=a; refresh_token=b')
    );
    const payload = await response.json();
    const setCookieHeader = response.headers.get('set-cookie') || '';

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      authenticated: false,
      message: 'Sesion invalida o expirada',
      success: false,
    });
    expect(setCookieHeader).toContain('access_token=');
    expect(setCookieHeader).toContain('refresh_token=');
  });

  it('returns an error envelope on GET unexpected failures', async () => {
    refreshSessionMock.mockRejectedValue(new Error('database down'));

    const response = await GET(
      createRequest('GET', 'access_token=a; refresh_token=b')
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error al obtener estado de sesión.',
    });
  });

  it('returns an error envelope on POST unexpected failures', async () => {
    refreshSessionMock.mockRejectedValue(new Error('database down'));

    const response = await POST(createRequest('POST', 'refresh_token=token'));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error al renovar token.',
    });
  });
});
