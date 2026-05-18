import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { isAuthResponse, normalizeAuthRole, withAuth } from '../with-auth';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

type MockSupabaseOptions = {
  profile?: { cargo_rol: string | null; email: string | null; id: string } | null;
  profileError?: unknown;
  user?: { email?: string; id: string } | null;
};

function buildSupabaseMock({ profile, profileError = null, user }: MockSupabaseOptions) {
  const single = vi.fn().mockResolvedValue({ data: profile, error: profileError });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const getUser = vi.fn().mockResolvedValue({ data: { user } });

  return {
    auth: { getUser },
    from,
  };
}

function request(): NextRequest {
  return new Request('http://localhost/api/secure') as NextRequest;
}

const mockedCreateClient = vi.mocked(createClient);

describe('withAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns UNAUTHENTICATED when there is no session user', async () => {
    mockedCreateClient.mockResolvedValue(buildSupabaseMock({ user: null }) as never);
    const route = withAuth(async () => NextResponse.json({ ok: true }));

    const response = await route(request(), undefined);

    await expect(response.json()).resolves.toMatchObject({
      error: 'UNAUTHENTICATED',
    });
    expect(response.status).toBe(401);
  });

  it('returns FORBIDDEN when the authenticated role is not allowed', async () => {
    mockedCreateClient.mockResolvedValue(
      buildSupabaseMock({
        profile: { cargo_rol: 'business', email: 'admin@soflia.com', id: 'user-1' },
        user: { id: 'user-1' },
      }) as never,
    );
    const route = withAuth(async () => NextResponse.json({ ok: true }), { roles: ['Admin'] });

    const response = await route(request(), undefined);

    await expect(response.json()).resolves.toMatchObject({
      error: 'FORBIDDEN',
    });
    expect(response.status).toBe(403);
  });

  it('returns PROFILE_NOT_FOUND when profile lookup fails', async () => {
    mockedCreateClient.mockResolvedValue(
      buildSupabaseMock({
        profile: null,
        profileError: new Error('db unavailable'),
        user: { email: 'user@soflia.com', id: 'user-1' },
      }) as never,
    );
    const route = withAuth(async () => NextResponse.json({ ok: true }));

    const response = await route(request(), undefined);

    await expect(response.json()).resolves.toMatchObject({
      error: 'PROFILE_NOT_FOUND',
    });
    expect(response.status).toBe(403);
  });

  it('returns FORBIDDEN when the stored role is unknown', async () => {
    mockedCreateClient.mockResolvedValue(
      buildSupabaseMock({
        profile: { cargo_rol: 'external-contractor', email: 'user@soflia.com', id: 'user-1' },
        user: { id: 'user-1' },
      }) as never,
    );
    const route = withAuth(async () => NextResponse.json({ ok: true }));

    const response = await route(request(), undefined);

    await expect(response.json()).resolves.toMatchObject({
      error: 'FORBIDDEN',
      message: 'El rol del usuario no permite acceder a este recurso.',
    });
  });

  it('passes normalized auth context to the route handler', async () => {
    mockedCreateClient.mockResolvedValue(
      buildSupabaseMock({
        profile: { cargo_rol: 'administrador', email: 'admin@soflia.com', id: 'user-1' },
        user: { email: 'fallback@soflia.com', id: 'user-1' },
      }) as never,
    );
    const handler = vi.fn(async (_request: NextRequest, auth) => NextResponse.json(auth));
    const route = withAuth(handler, { roles: ['Admin'] });

    const response = await route(request(), undefined);

    await expect(response.json()).resolves.toEqual({
      email: 'admin@soflia.com',
      role: 'Admin',
      userId: 'user-1',
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('falls back to auth email when profile email is null', async () => {
    mockedCreateClient.mockResolvedValue(
      buildSupabaseMock({
        profile: { cargo_rol: 'business_user', email: null, id: 'user-1' },
        user: { email: 'fallback@soflia.com', id: 'user-1' },
      }) as never,
    );
    const route = withAuth(async (_request, auth) => NextResponse.json(auth), { roles: ['BusinessUser'] });

    const response = await route(request(), undefined);

    await expect(response.json()).resolves.toMatchObject({
      email: 'fallback@soflia.com',
      role: 'BusinessUser',
    });
  });
});

describe('normalizeAuthRole', () => {
  it.each([
    ['Administrador', 'Admin'],
    ['administrador', 'Admin'],
    [' business ', 'Business'],
    ['business_user', 'BusinessUser'],
    ['Business User', 'BusinessUser'],
    ['instructor', 'Instructor'],
    [null, null],
    [undefined, null],
    ['unknown', null],
  ] as const)('normalizes %s to %s', (input, expected) => {
    expect(normalizeAuthRole(input)).toBe(expected);
  });
});

describe('isAuthResponse', () => {
  it('detects NextResponse values', () => {
    expect(isAuthResponse(NextResponse.json({ ok: false }))).toBe(true);
  });

  it('does not treat auth context as a response', () => {
    expect(
      isAuthResponse({
        email: 'admin@soflia.com',
        role: 'Admin',
        userId: 'user-1',
      }),
    ).toBe(false);
  });
});
