import crypto from 'crypto';
import type {
  OAuthInitParams,
  OAuthOrganizationContext,
} from './oauth-flow.types';

export const OAUTH_STATE_COOKIE_NAME = 'oauth_state';
export const OAUTH_ORG_CONTEXT_COOKIE_NAME = 'oauth_org_context';

interface CreateOAuthStateResult {
  csrfToken: string;
  organizationContext?: OAuthOrganizationContext;
  state: string;
}

interface ValidateOAuthStateInput {
  receivedState?: string;
  storedState?: string;
}

interface ValidateOAuthStateResult {
  error?: string;
  valid: boolean;
}

export function hasOAuthOrganizationContext(params: OAuthInitParams): boolean {
  return Boolean(
    params.organizationId || params.invitationToken || params.bulkInviteToken
  );
}

export function createOAuthState(
  params: OAuthInitParams,
  csrfToken = crypto.randomBytes(32).toString('base64url')
): CreateOAuthStateResult {
  if (!hasOAuthOrganizationContext(params)) {
    return {
      csrfToken,
      state: csrfToken,
    };
  }

  const organizationContext: OAuthOrganizationContext = {
    orgId: params.organizationId,
    orgSlug: params.organizationSlug,
    invToken: params.invitationToken,
    bulkToken: params.bulkInviteToken,
  };

  return {
    csrfToken,
    organizationContext,
    state: Buffer.from(
      JSON.stringify({
        csrf: csrfToken,
        ...organizationContext,
      })
    ).toString('base64url'),
  };
}

export function extractCsrfTokenFromState(state: string): string {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as { csrf?: string };

    return parsed.csrf || state;
  } catch {
    return state;
  }
}

export function parseOAuthOrganizationContext(
  cookieValue?: string
): OAuthOrganizationContext {
  if (!cookieValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(cookieValue) as OAuthOrganizationContext;

    return {
      orgId: parsed.orgId,
      orgSlug: parsed.orgSlug,
      invToken: parsed.invToken,
      bulkToken: parsed.bulkToken,
    };
  } catch {
    return {};
  }
}

export function validateOAuthState({
  receivedState,
  storedState,
}: ValidateOAuthStateInput): ValidateOAuthStateResult {
  if (!storedState) {
    return {
      error:
        'Sesion de autenticacion expirada. Por favor, inicia el proceso nuevamente.',
      valid: false,
    };
  }

  if (!receivedState) {
    return {
      error: 'Error de validacion de seguridad (CSRF). Intenta nuevamente.',
      valid: false,
    };
  }

  if (storedState !== extractCsrfTokenFromState(receivedState)) {
    return {
      error: 'Error de validacion de seguridad (CSRF). Intenta nuevamente.',
      valid: false,
    };
  }

  return { valid: true };
}
