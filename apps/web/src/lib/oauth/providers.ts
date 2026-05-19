import { OAuthProvider } from '../../features/auth/types/oauth.types';
import { getGoogleAuthUrl } from './google';
import { getMicrosoftAuthUrl } from './microsoft';

export interface OAuthProviderConfig {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  getAuthUrl: (state?: string) => string;
}

export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: {
    name: 'google',
    displayName: 'Google',
    icon: 'google',
    color: 'var(--color-legacy-4285f4)',
    getAuthUrl: getGoogleAuthUrl,
  },
  github: {
    name: 'github',
    displayName: 'GitHub',
    icon: 'github',
    color: 'var(--color-legacy-24292e)',
    getAuthUrl: () => {
      throw new Error('GitHub OAuth no implementado aún');
    },
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook',
    icon: 'facebook',
    color: 'var(--color-legacy-1877f2)',
    getAuthUrl: () => {
      throw new Error('Facebook OAuth no implementado aún');
    },
  },
  microsoft: {
    name: 'microsoft',
    displayName: 'Microsoft',
    icon: 'microsoft',
    color: 'var(--color-legacy-0078d4)',
    getAuthUrl: (state) => getMicrosoftAuthUrl(state || ''),
  },
};

export function getProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
  return OAUTH_PROVIDERS[provider];
}
