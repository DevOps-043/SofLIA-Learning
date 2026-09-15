import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('../../../../../lib/supabase/admin', () => ({ createAdminClient: vi.fn(() => ({})) }));
vi.mock('../../auth.service', () => ({ AuthService: { clearExpiredSessions: vi.fn() } }));
vi.mock('../../oauth.service', () => ({ OAuthService: {
  resolveOAuthUser: vi.fn(),
  createUserFromOAuth: vi.fn(),
  upsertOAuthAccount: vi.fn(),
} }));
vi.mock('../../auth-session.service', () => ({
  createServerAuthSession: vi.fn(),
  updateLastLoginAt: vi.fn(),
  notifyLoginSuccessWithTimeout: vi.fn(),
}));
vi.mock('../oauth-invitation.service', () => ({
  resolveOAuthInvitationContext: vi.fn(),
  linkOAuthUserToOrganization: vi.fn(),
}));
vi.mock('../oauth-redirect.service', () => ({ resolveOAuthDashboardDestination: vi.fn() }));

import { processOAuthCallback } from '../oauth-callback.service';
import type { OAuthProviderAdapter } from '../oauth-flow.types';
import type { OAuthTokens } from '../../../types/oauth.types';
import type { RequestMetadata } from '../../auth-session.service';
import { createServerAuthSession } from '../../auth-session.service';
import { OAuthService } from '../../oauth.service';
import { resolveOAuthInvitationContext } from '../oauth-invitation.service';
import { resolveOAuthDashboardDestination } from '../oauth-redirect.service';

const requestMetadata: RequestMetadata = {
  ip: '203.0.113.10',
  userAgent: 'vitest',
};

function createProvider(
  exchangeCodeForTokens = vi.fn<OAuthProviderAdapter<OAuthTokens>['exchangeCodeForTokens']>()
): OAuthProviderAdapter<OAuthTokens> {
  return {
    exchangeCodeForTokens,
    getProfile: vi.fn<OAuthProviderAdapter<OAuthTokens>['getProfile']>(),
    provider: 'google',
    providerLabel: 'Google',
    toOAuthTokens: (tokens) => tokens,
  };
}

describe('processOAuthCallback OAuth state validation', () => {
  it('rejects callbacks when the received state is missing', async () => {
    const exchangeCodeForTokens = vi.fn();
    const result = await processOAuthCallback({
      params: { code: 'auth-code' },
      provider: createProvider(exchangeCodeForTokens),
      requestMetadata,
      storedState: 'csrf-token',
    });

    expect(result).toEqual({
      error: 'Error de validacion de seguridad (CSRF). Intenta nuevamente.',
    });
    expect(exchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it('rejects callbacks when the received state does not match the stored CSRF token', async () => {
    const exchangeCodeForTokens = vi.fn();
    const result = await processOAuthCallback({
      params: { code: 'auth-code', state: 'attacker-token' },
      provider: createProvider(exchangeCodeForTokens),
      requestMetadata,
      storedState: 'csrf-token',
    });

    expect(result).toEqual({
      error: 'Error de validacion de seguridad (CSRF). Intenta nuevamente.',
    });
    expect(exchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it('continues to token exchange when the state is valid', async () => {
    const exchangeCodeForTokens = vi
      .fn<OAuthProviderAdapter<OAuthTokens>['exchangeCodeForTokens']>()
      .mockRejectedValue(new Error('provider unavailable'));

    const result = await processOAuthCallback({
      params: { code: 'auth-code', state: 'csrf-token' },
      provider: createProvider(exchangeCodeForTokens),
      requestMetadata,
      storedState: 'csrf-token',
    });

    expect(exchangeCodeForTokens).toHaveBeenCalledWith('auth-code');
    expect(result).toEqual({
      error: 'Error procesando autenticacion. Intentalo de nuevo.',
    });
  });
});

describe('processOAuthCallback identity resolution', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(resolveOAuthInvitationContext).mockResolvedValue({ value: { orgContext: {} } });
    vi.mocked(resolveOAuthDashboardDestination).mockResolvedValue('/dashboard');
  });

  async function callback() {
    const provider = createProvider();
    vi.mocked(provider.exchangeCodeForTokens).mockResolvedValue({ access_token: 'test-token', token_type: 'Bearer', scope: 'openid email' });
    vi.mocked(provider.getProfile).mockResolvedValue({
      providerAccountId: 'stable-google-id', email: 'person@old.example',
      firstName: 'Test', lastName: 'User', fullName: 'Test User',
    });
    return processOAuthCallback({
      params: { code: 'code', state: 'csrf-token' }, provider, requestMetadata, storedState: 'csrf-token',
    });
  }

  it('creates the session for the linked user even when the provider email has changed', async () => {
    vi.mocked(OAuthService.resolveOAuthUser).mockResolvedValue({
      id: 'original-user', email: 'person@new.example', username: 'original',
    });
    const result = await callback();

    expect(OAuthService.resolveOAuthUser).toHaveBeenCalledWith('google', 'stable-google-id', 'person@old.example', undefined);
    expect(result).toMatchObject({ userId: 'original-user', isNewUser: false, destination: '/dashboard' });
    expect(OAuthService.createUserFromOAuth).not.toHaveBeenCalled();
    expect(OAuthService.upsertOAuthAccount).toHaveBeenCalledWith('original-user', 'google', 'stable-google-id', expect.any(Object));
    expect(createServerAuthSession).toHaveBeenCalledWith(expect.objectContaining({ userId: 'original-user' }));
    expect(resolveOAuthInvitationContext).toHaveBeenCalledWith(expect.objectContaining({ existingUserId: 'original-user' }));
  });

  it('still provisions a new user when neither an identity link nor a matching profile exists', async () => {
    vi.mocked(OAuthService.resolveOAuthUser).mockResolvedValue(null);
    vi.mocked(OAuthService.createUserFromOAuth).mockResolvedValue('new-user');
    expect(await callback()).toMatchObject({ userId: 'new-user', isNewUser: true });
    expect(createServerAuthSession).toHaveBeenCalledWith(expect.objectContaining({ userId: 'new-user' }));
  });

  it('does not create a user, relink an account or issue a session on identity lookup failure', async () => {
    vi.mocked(OAuthService.resolveOAuthUser).mockRejectedValue(new Error('Linked profile missing'));
    expect(await callback()).toEqual({ error: 'Error procesando autenticacion. Intentalo de nuevo.' });
    expect(OAuthService.createUserFromOAuth).not.toHaveBeenCalled();
    expect(OAuthService.upsertOAuthAccount).not.toHaveBeenCalled();
    expect(createServerAuthSession).not.toHaveBeenCalled();
  });
});
