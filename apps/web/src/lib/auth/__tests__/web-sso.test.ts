import { afterEach, describe, expect, it, vi } from 'vitest';

import { deriveCodeChallenge } from '@/lib/auth/desktop-sso';
import {
  buildWebSsoCallbackUrl,
  buildWebSsoErrorUrl,
  isAllowedWebSsoRedirectUri,
  isValidWebSsoState,
  parseWebSsoRequest,
  serializeWebSsoRequest,
} from '@/lib/auth/web-sso';

const LOCAL_CALLBACK = 'http://localhost:3000/api/auth/callback/learning';
const PRODUCTION_CALLBACK =
  'https://projects.soflia.test/api/auth/callback/learning';
const STATE = `${'payload'.repeat(24)}.${'signature'.repeat(6)}`;
const CODE_CHALLENGE = deriveCodeChallenge('v'.repeat(64));

describe('web SSO redirect allowlist', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('acepta solo el callback local exacto fuera de produccion', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('PROJECT_HUB_SSO_REDIRECT_URIS', '');

    expect(isAllowedWebSsoRedirectUri(LOCAL_CALLBACK)).toBe(true);
    expect(isAllowedWebSsoRedirectUri(`${LOCAL_CALLBACK}/extra`)).toBe(false);
    expect(
      isAllowedWebSsoRedirectUri(
        'http://localhost:3000.evil.test/api/auth/callback/learning'
      )
    ).toBe(false);
  });

  it('trata el state firmado de Project Hub como opaco y admite el separador', () => {
    expect(isValidWebSsoState(STATE)).toBe(true);
    expect(isValidWebSsoState('corto')).toBe(false);
    expect(isValidWebSsoState(`${STATE}\ninyectado`)).toBe(false);
    expect(isValidWebSsoState('x'.repeat(2_049))).toBe(false);
  });

  it('en produccion solo acepta las URLs configuradas explicitamente', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PROJECT_HUB_SSO_REDIRECT_URIS', PRODUCTION_CALLBACK);

    expect(isAllowedWebSsoRedirectUri(PRODUCTION_CALLBACK)).toBe(true);
    expect(isAllowedWebSsoRedirectUri(LOCAL_CALLBACK)).toBe(false);
  });

  it('ignora callbacks configurados con protocolo, credenciales o ruta inseguros', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv(
      'PROJECT_HUB_SSO_REDIRECT_URIS',
      [
        'http://projects.soflia.test/api/auth/callback/learning',
        'https://user@projects.soflia.test/api/auth/callback/learning',
        'https://projects.soflia.test/otra-ruta',
      ].join(',')
    );

    expect(
      isAllowedWebSsoRedirectUri(
        'http://projects.soflia.test/api/auth/callback/learning'
      )
    ).toBe(false);
    expect(
      isAllowedWebSsoRedirectUri(
        'https://user@projects.soflia.test/api/auth/callback/learning'
      )
    ).toBe(false);
  });

  it('descarta cookies alteradas o cuyo callback dejo de estar permitido', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PROJECT_HUB_SSO_REDIRECT_URIS', PRODUCTION_CALLBACK);

    const serialized = serializeWebSsoRequest({
      codeChallenge: CODE_CHALLENGE,
      redirectUri: PRODUCTION_CALLBACK,
      state: STATE,
    });

    expect(parseWebSsoRequest(serialized)).toEqual({
      codeChallenge: CODE_CHALLENGE,
      redirectUri: PRODUCTION_CALLBACK,
      state: STATE,
    });

    vi.stubEnv('PROJECT_HUB_SSO_REDIRECT_URIS', '');
    expect(parseWebSsoRequest(serialized)).toBeNull();
  });

  it('construye los retornos exclusivamente sobre el callback validado', () => {
    expect(buildWebSsoCallbackUrl(PRODUCTION_CALLBACK, 'ticket', STATE)).toBe(
      `${PRODUCTION_CALLBACK}?state=${STATE}&ticket=ticket`
    );
    expect(buildWebSsoErrorUrl(PRODUCTION_CALLBACK, STATE, 'access_denied')).toBe(
      `${PRODUCTION_CALLBACK}?state=${STATE}&error=access_denied`
    );
  });
});
