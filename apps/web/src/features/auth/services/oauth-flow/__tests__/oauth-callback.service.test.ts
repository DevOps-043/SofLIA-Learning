import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { processOAuthCallback } from '../oauth-callback.service';
import type { OAuthProviderAdapter } from '../oauth-flow.types';
import type { OAuthTokens } from '../../../types/oauth.types';
import type { RequestMetadata } from '../../auth-session.service';

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

  it('does not trust an email that the SSO provider explicitly marks unverified', async () => {
    const tokens: OAuthTokens = {
      access_token: 'access-token',
      scope: 'openid email',
      token_type: 'Bearer',
    };
    const provider = createProvider(vi.fn().mockResolvedValue(tokens));
    vi.mocked(provider.getProfile).mockResolvedValue({
      email: 'person@example.com',
      emailVerified: false,
      firstName: 'Person',
      fullName: 'Person Example',
      lastName: 'Example',
      providerAccountId: 'provider-account',
    });

    const result = await processOAuthCallback({
      params: { code: 'auth-code', state: 'csrf-token' },
      provider,
      requestMetadata,
      storedState: 'csrf-token',
    });

    expect(result).toEqual({
      error: 'El proveedor SSO no ha verificado este correo.',
    });
  });
});
