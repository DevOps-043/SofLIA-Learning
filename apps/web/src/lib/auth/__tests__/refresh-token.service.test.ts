import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, createAdminClientMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('../../supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

import { RefreshTokenService } from '../refreshToken.service';

function createCookieStore(refreshToken?: string) {
  return {
    delete: vi.fn(),
    get: vi.fn((name: string) =>
      name === 'refresh_token' && refreshToken
        ? { value: refreshToken }
        : undefined
    ),
    set: vi.fn(),
  };
}

function createSupabaseMock(options?: {
  insertError?: { message: string } | null;
  lookupError?: { message: string } | null;
  tokenData?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
}) {
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options?.tokenData ?? null,
      error: options?.lookupError ?? null,
    }),
  };

  const updateBuilder = {
    eq: vi.fn().mockReturnThis(),
    error: options?.updateError ?? null,
  };

  const insert = vi.fn().mockResolvedValue({
    error: options?.insertError ?? null,
  });
  const select = vi.fn().mockReturnValue(selectChain);
  const update = vi.fn().mockReturnValue(updateBuilder);

  return {
    insert,
    select,
    selectChain,
    supabase: {
      from: vi.fn().mockReturnValue({
        insert,
        select,
        update,
      }),
    },
    update,
    updateBuilder,
  };
}

describe('RefreshTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a session with hashed refresh token metadata', async () => {
    const cookieStore = createCookieStore();
    const { insert, supabase } = createSupabaseMock();
    const request = new Request('http://localhost', {
      headers: {
        'accept-encoding': 'gzip',
        'accept-language': 'es-MX',
        'user-agent': 'Vitest',
        'x-forwarded-for': '203.0.113.5',
      },
    });

    cookiesMock.mockResolvedValue(cookieStore);
    createAdminClientMock.mockReturnValue(supabase);

    const session = await RefreshTokenService.createSession(
      'user-1',
      true,
      request
    );

    const insertedPayload = insert.mock.calls[0][0];

    expect(session.userId).toBe('user-1');
    expect(session.refreshToken).not.toBe(insertedPayload.token_hash);
    expect(insertedPayload).toMatchObject({
      ip_address: '203.0.113.5',
      is_revoked: false,
      user_agent: 'Vitest',
      user_id: 'user-1',
    });
    expect(insertedPayload.token_hash).toHaveLength(64);
    expect(insertedPayload.device_fingerprint).toHaveLength(64);
  });

  it('refreshes the access token with direct token hash lookup', async () => {
    const cookieStore = createCookieStore('plain-refresh-token');
    const refreshTokenRow = {
      created_at: '2026-04-01T00:00:00.000Z',
      expires_at: '2030-04-01T00:00:00.000Z',
      id: 'token-1',
      is_revoked: false,
      last_used_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      token_hash: 'hashed',
      user_id: 'user-1',
    };
    const { selectChain, supabase, update, updateBuilder } = createSupabaseMock(
      {
        tokenData: refreshTokenRow,
      }
    );

    cookiesMock.mockResolvedValue(cookieStore);
    createAdminClientMock.mockReturnValue(supabase);

    const session = await RefreshTokenService.refreshSession();
    const expectedHash = await RefreshTokenService.hashTokenForLookup(
      'plain-refresh-token'
    );

    expect(selectChain.eq).toHaveBeenCalledWith('token_hash', expectedHash);
    expect(selectChain.eq).toHaveBeenCalledWith('is_revoked', false);
    expect(selectChain.gt).toHaveBeenCalledWith(
      'expires_at',
      expect.any(String)
    );
    expect(update).toHaveBeenCalledWith({
      last_used_at: expect.any(String),
    });
    expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'token-1');
    expect(cookieStore.set).toHaveBeenCalledWith(
      'access_token',
      expect.any(String),
      expect.objectContaining({
        expires: expect.any(Date),
        httpOnly: true,
      })
    );
    expect(session).toMatchObject({
      refreshExpiresAt: new Date(refreshTokenRow.expires_at),
      userId: 'user-1',
    });
  });

  it('revokes stale refresh tokens before rejecting the session', async () => {
    const cookieStore = createCookieStore('stale-refresh-token');
    const staleTokenRow = {
      created_at: '2026-04-01T00:00:00.000Z',
      expires_at: '2030-04-01T00:00:00.000Z',
      id: 'token-2',
      is_revoked: false,
      last_used_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      token_hash: 'hashed',
      user_id: 'user-2',
    };
    const { supabase, update } = createSupabaseMock({
      tokenData: staleTokenRow,
    });

    cookiesMock.mockResolvedValue(cookieStore);
    createAdminClientMock.mockReturnValue(supabase);

    await expect(RefreshTokenService.refreshSession()).rejects.toMatchObject({
      code: 'INACTIVE_REFRESH_TOKEN',
      name: 'RefreshTokenError',
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_revoked: true,
        revoked_reason: 'Session expired due to inactivity',
      })
    );
  });
});
