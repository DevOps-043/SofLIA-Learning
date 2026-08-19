import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  getCurrentUserMock,
  hasActiveMembershipMock,
  issueTicketMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  hasActiveMembershipMock: vi.fn(),
  issueTicketMock: vi.fn(),
}));

vi.mock('@/features/auth/services/session.service', () => ({
  SessionService: { getCurrentUser: getCurrentUserMock },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@/features/auth/services/auth-session.service', () => ({
  getRequestMetadata: vi.fn(() => ({ ip: '127.0.0.1', userAgent: 'test' })),
}));

vi.mock('@/features/auth/services/desktop-sso.service', () => ({
  hasActiveMembership: hasActiveMembershipMock,
  issueDesktopSsoTicket: issueTicketMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

import { GET } from '../route';

const STATE = `${'payload'.repeat(24)}.${'signature'.repeat(6)}`;
const CALLBACK = 'http://localhost:3000/api/auth/callback/learning';

function createRequest(redirectUri: string, codeChallenge = 'invalid') {
  const url = new URL('http://localhost:3000/api/auth/web/start');
  url.searchParams.set('state', STATE);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('redirect_uri', redirectUri);
  return new NextRequest(url);
}

describe('/api/auth/web/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('PROJECT_HUB_SSO_REDIRECT_URIS', '');
    hasActiveMembershipMock.mockResolvedValue(true);
    issueTicketMock.mockResolvedValue('a'.repeat(64));
  });

  it('rechaza el redirect no autorizado antes de consultar la sesion', async () => {
    const response = await GET(
      createRequest('https://attacker.test/api/auth/callback/learning')
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_request' });
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  it('devuelve errores de parametros solo al callback exacto permitido', async () => {
    const response = await GET(createRequest(CALLBACK));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get('location')).toBe(
      `${CALLBACK}?state=${STATE}&error=invalid_request`
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  it('reutiliza la sesion web y emite el ticket inmediatamente', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    const codeChallenge = 'c'.repeat(43);
    const response = await GET(createRequest(CALLBACK, codeChallenge));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get('location')).toBe(
      `${CALLBACK}?state=${STATE}&ticket=${'a'.repeat(64)}`
    );
    expect(hasActiveMembershipMock).toHaveBeenCalledWith('user-1');
    expect(issueTicketMock).toHaveBeenCalledWith({
      codeChallenge,
      ipAddress: '127.0.0.1',
      userAgent: 'test',
      userId: 'user-1',
    });
  });
});
