import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  applyAuthRateLimitMock,
  consumeTicketMock,
  generateProofMock,
  hasActiveMembershipMock,
} = vi.hoisted(() => ({
  applyAuthRateLimitMock: vi.fn(),
  consumeTicketMock: vi.fn(),
  generateProofMock: vi.fn(),
  hasActiveMembershipMock: vi.fn(),
}));

vi.mock('@/lib/auth/auth-rate-limit', () => ({
  applyAuthRateLimit: applyAuthRateLimitMock,
}));

vi.mock('@/features/auth/services/desktop-sso.service', () => ({
  consumeDesktopSsoTicket: consumeTicketMock,
  generateDesktopAccessProof: generateProofMock,
  hasActiveMembership: hasActiveMembershipMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

import { POST } from '../route';

const TICKET = 'a'.repeat(64);
const VERIFIER = 'v'.repeat(64);

function createRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/auth/web/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/auth/web/exchange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyAuthRateLimitMock.mockReturnValue(null);
    consumeTicketMock.mockResolvedValue({ ok: true, userId: 'user-1' });
    hasActiveMembershipMock.mockResolvedValue(true);
    generateProofMock.mockResolvedValue({ tokenHash: 'magic-hash' });
  });

  it('devuelve el token hash sin permitir cache', async () => {
    const response = await POST(
      createRequest({ ticket: TICKET, code_verifier: VERIFIER })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ tokenHash: 'magic-hash' });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(consumeTicketMock).toHaveBeenCalledWith(TICKET, VERIFIER);
  });

  it('hace indistinguibles los formatos y tickets invalidos', async () => {
    const malformed = await POST(createRequest({ ticket: 'corto' }));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: 'invalid_ticket' });

    consumeTicketMock.mockResolvedValue({ code: 'invalid_ticket', ok: false });
    const consumed = await POST(
      createRequest({ ticket: TICKET, code_verifier: VERIFIER })
    );
    expect(consumed.status).toBe(400);
    expect(await consumed.json()).toEqual({ error: 'invalid_ticket' });
  });

  it('deniega usuarios sin membresia activa', async () => {
    hasActiveMembershipMock.mockResolvedValue(false);
    const response = await POST(
      createRequest({ ticket: TICKET, code_verifier: VERIFIER })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'access_denied' });
    expect(generateProofMock).not.toHaveBeenCalled();
  });

  it('normaliza el rate limit al contrato web y conserva Retry-After', async () => {
    applyAuthRateLimitMock.mockReturnValue(
      new Response(null, { status: 429, headers: { 'Retry-After': '30' } })
    );
    const response = await POST(
      createRequest({ ticket: TICKET, code_verifier: VERIFIER })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: 'exchange_unavailable' });
    expect(response.headers.get('retry-after')).toBe('30');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
