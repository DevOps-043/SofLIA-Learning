import { describe, expect, it } from 'vitest';
import {
  createOAuthState,
  extractCsrfTokenFromState,
  parseOAuthOrganizationContext,
  validateOAuthState,
} from '../oauth-state.service';

describe('oauth-state.service', () => {
  it('creates a simple state when there is no organization context', () => {
    const result = createOAuthState({}, 'csrf-token');

    expect(result.csrfToken).toBe('csrf-token');
    expect(result.organizationContext).toBeUndefined();
    expect(result.state).toBe('csrf-token');
  });

  it('encodes organization context inside the OAuth state payload', () => {
    const result = createOAuthState(
      {
        bulkInviteToken: 'bulk-token',
        invitationToken: 'invite-token',
        organizationId: 'org-1',
        organizationSlug: 'acme',
      },
      'csrf-token'
    );

    expect(extractCsrfTokenFromState(result.state)).toBe('csrf-token');
    expect(result.organizationContext).toEqual({
      bulkToken: 'bulk-token',
      invToken: 'invite-token',
      orgId: 'org-1',
      orgSlug: 'acme',
    });
  });

  it('parses stored organization context cookies safely', () => {
    expect(
      parseOAuthOrganizationContext(
        JSON.stringify({
          bulkToken: 'bulk-token',
          invToken: 'invite-token',
          orgId: 'org-1',
          orgSlug: 'acme',
        })
      )
    ).toEqual({
      bulkToken: 'bulk-token',
      invToken: 'invite-token',
      orgId: 'org-1',
      orgSlug: 'acme',
    });
  });

  it('returns an empty context when the cookie payload is invalid', () => {
    expect(parseOAuthOrganizationContext('not-json')).toEqual({});
  });

  it('rejects OAuth state validation when the stored state is missing', () => {
    expect(
      validateOAuthState({
        receivedState: 'csrf-token',
      })
    ).toEqual({
      error:
        'Sesion de autenticacion expirada. Por favor, inicia el proceso nuevamente.',
      valid: false,
    });
  });

  it('rejects OAuth state validation on CSRF mismatch', () => {
    const encodedState = createOAuthState(
      { organizationId: 'org-1' },
      'expected-token'
    ).state;

    expect(
      validateOAuthState({
        receivedState: encodedState,
        storedState: 'different-token',
      })
    ).toEqual({
      error: 'Error de validacion de seguridad (CSRF). Intenta nuevamente.',
      valid: false,
    });
  });

  it('accepts OAuth state validation when the stored token matches', () => {
    const encodedState = createOAuthState(
      { organizationId: 'org-1' },
      'expected-token'
    ).state;

    expect(
      validateOAuthState({
        receivedState: encodedState,
        storedState: 'expected-token',
      })
    ).toEqual({ valid: true });
  });
});
