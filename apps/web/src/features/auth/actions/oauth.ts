'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { logger } from '../../../lib/logger';
import { getGoogleAuthUrl } from '../../../lib/oauth/google';
import { getMicrosoftAuthUrl } from '../../../lib/oauth/microsoft';
import {
  getRequestMetadata,
  writeServerAuthSessionCookies,
} from '../services/auth-session.service';
import { GoogleOAuthService } from '../services/google-oauth.service';
import { MicrosoftOAuthService } from '../services/microsoft-oauth.service';
import {
  initiateOAuthLoginFlow,
  normalizeGoogleOAuthProfile,
  normalizeMicrosoftOAuthProfile,
  normalizeMicrosoftOAuthTokens,
  OAUTH_ORG_CONTEXT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  processOAuthCallback,
} from '../services/oauth-flow';
import type {
  OAuthInitParams,
  OAuthProviderAdapter,
} from '../services/oauth-flow';
import type {
  OAuthCallbackParams,
  OAuthTokens,
} from '../types/oauth.types';
import type { MicrosoftTokens } from '../services/microsoft-oauth.service';

const googleOAuthAdapter: OAuthProviderAdapter<OAuthTokens> = {
  exchangeCodeForTokens: GoogleOAuthService.exchangeCodeForTokens,
  getProfile: async (tokens) =>
    normalizeGoogleOAuthProfile(
      await GoogleOAuthService.getUserProfile(tokens.access_token)
    ),
  provider: 'google',
  providerLabel: 'Google',
  shouldNotifyLoginSuccess: true,
  toOAuthTokens: (tokens) => tokens,
};

const microsoftOAuthAdapter: OAuthProviderAdapter<MicrosoftTokens> = {
  exchangeCodeForTokens: MicrosoftOAuthService.exchangeCodeForTokens,
  getProfile: async (tokens) =>
    normalizeMicrosoftOAuthProfile(
      await MicrosoftOAuthService.getUserProfile(tokens.access_token)
    ),
  provider: 'microsoft',
  providerLabel: 'Microsoft',
  toOAuthTokens: normalizeMicrosoftOAuthTokens,
};

async function handleOAuthProviderCallback<TProviderTokens>(
  params: OAuthCallbackParams,
  provider: OAuthProviderAdapter<TProviderTokens>
) {
  try {
    const cookieStore = await cookies();
    const storedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
    const orgContextCookie = cookieStore.get(OAUTH_ORG_CONTEXT_COOKIE_NAME)?.value;

    cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
    cookieStore.delete(OAUTH_ORG_CONTEXT_COOKIE_NAME);

    const result = await processOAuthCallback({
      orgContextCookie,
      params,
      provider,
      requestMetadata: getRequestMetadata(await headers()),
      storedState,
    });

    if (result.error || !result.session || !result.destination) {
      return {
        error:
          result.error ||
          'Error procesando autenticacion. Intentalo de nuevo.',
      };
    }

    writeServerAuthSessionCookies(cookieStore, result.session);
    redirect(result.destination);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as { digest?: unknown }).digest;

      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
    }

    logger.error(`Error en callback ${provider.providerLabel} OAuth`, error);

    return {
      error: 'Error procesando autenticacion. Intentalo de nuevo.',
    };
  }
}

export async function initiateGoogleLogin(params: OAuthInitParams = {}) {
  const cookieStore = await cookies();
  const authUrl = initiateOAuthLoginFlow({
    authUrlFactory: getGoogleAuthUrl,
    cookieStore,
    params,
  });

  redirect(authUrl);
}

export async function handleGoogleCallback(params: OAuthCallbackParams) {
  return handleOAuthProviderCallback(params, googleOAuthAdapter);
}

export async function initiateMicrosoftLogin(params: OAuthInitParams = {}) {
  const cookieStore = await cookies();
  const authUrl = initiateOAuthLoginFlow({
    authUrlFactory: getMicrosoftAuthUrl,
    cookieStore,
    params,
  });

  redirect(authUrl);
}

export async function handleMicrosoftCallback(params: OAuthCallbackParams) {
  return handleOAuthProviderCallback(params, microsoftOAuthAdapter);
}
