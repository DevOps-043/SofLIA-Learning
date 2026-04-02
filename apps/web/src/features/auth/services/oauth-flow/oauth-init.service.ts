import type { OAuthInitParams } from './oauth-flow.types';
import {
  createOAuthState,
  OAUTH_ORG_CONTEXT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from './oauth-state.service';

export interface OAuthCookieStore {
  set(name: string, value: string, options: Record<string, unknown>): void;
}

interface InitiateOAuthLoginInput {
  authUrlFactory(state: string): string;
  cookieStore: OAuthCookieStore;
  params?: OAuthInitParams;
}

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 10 * 60,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export function initiateOAuthLoginFlow({
  authUrlFactory,
  cookieStore,
  params = {},
}: InitiateOAuthLoginInput): string {
  const { csrfToken, organizationContext, state } = createOAuthState(params);

  cookieStore.set(OAUTH_STATE_COOKIE_NAME, csrfToken, OAUTH_COOKIE_OPTIONS);

  if (organizationContext) {
    cookieStore.set(
      OAUTH_ORG_CONTEXT_COOKIE_NAME,
      JSON.stringify(organizationContext),
      OAUTH_COOKIE_OPTIONS
    );
  }

  return authUrlFactory(state);
}
