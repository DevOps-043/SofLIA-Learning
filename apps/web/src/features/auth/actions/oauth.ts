'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { logger } from '../../../lib/logger';
import { getGoogleAuthUrl } from '../../../lib/oauth/google';
import { getMicrosoftAuthUrl } from '../../../lib/oauth/microsoft';
import { createAdminClient } from '../../../lib/supabase/admin';
import {
  buildDesktopErrorUrl,
  DESKTOP_SSO_COOKIE_NAME,
  parseDesktopSsoRequest,
} from '../../../lib/auth/desktop-sso';
import {
  buildWebSsoErrorUrl,
  parseWebSsoRequest,
  WEB_SSO_COOKIE_NAME,
} from '../../../lib/auth/web-sso';
import {
  getRequestMetadata,
  writeServerAuthSessionCookies,
} from '../services/auth-session.service';
import {
  buildDesktopHandoffUrl,
  buildWebHandoffUrl,
} from '../services/desktop-sso.service';
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

async function uploadMicrosoftPhotoToStorage(
  photoBuffer: ArrayBuffer,
  providerAccountId: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const path = `oauth/microsoft_${providerAccountId}.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, photoBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (error) {
      logger.error('Microsoft OAuth: error uploading photo to storage', error);
      return null;
    }
    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
    return publicData.publicUrl ?? null;
  } catch (err) {
    logger.error('Microsoft OAuth: unexpected error uploading photo', err);
    return null;
  }
}

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
  getProfile: async (tokens) => {
    const [profile, photoBuffer] = await Promise.all([
      MicrosoftOAuthService.getUserProfile(tokens.access_token),
      MicrosoftOAuthService.getUserPhoto(tokens.access_token),
    ]);
    const normalized = normalizeMicrosoftOAuthProfile(profile);
    if (photoBuffer) {
      const pictureUrl = await uploadMicrosoftPhotoToStorage(photoBuffer, normalized.providerAccountId);
      if (pictureUrl) {
        return { ...normalized, picture: pictureUrl };
      }
    }
    return normalized;
  },
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
    const desktopRequest = parseDesktopSsoRequest(
      cookieStore.get(DESKTOP_SSO_COOKIE_NAME)?.value
    );
    const webRequest = parseWebSsoRequest(
      cookieStore.get(WEB_SSO_COOKIE_NAME)?.value
    );

    cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
    cookieStore.delete(OAUTH_ORG_CONTEXT_COOKIE_NAME);
    cookieStore.delete(DESKTOP_SSO_COOKIE_NAME);
    cookieStore.delete(WEB_SSO_COOKIE_NAME);

    const requestMetadata = getRequestMetadata(await headers());
    const result = await processOAuthCallback({
      orgContextCookie,
      params,
      provider,
      requestMetadata,
      storedState,
    });

    if (result.error || !result.session || !result.destination) {
      const handoffError = params.error
        ? 'access_denied'
        : 'exchange_unavailable';

      if (webRequest) {
        return {
          webHandoffUrl: buildWebSsoErrorUrl(
            webRequest.redirectUri,
            webRequest.state,
            handoffError
          ),
        };
      }

      if (desktopRequest) {
        return {
          desktopHandoffUrl: buildDesktopErrorUrl(
            desktopRequest.state,
            handoffError
          ),
        };
      }

      return {
        error:
          result.error ||
          'Error procesando autenticacion. Intentalo de nuevo.',
      };
    }

    writeServerAuthSessionCookies(cookieStore, result.session);

    if (webRequest && result.userId) {
      return {
        webHandoffUrl: await buildWebHandoffUrl({
          codeChallenge: webRequest.codeChallenge,
          ipAddress: requestMetadata.ip,
          redirectUri: webRequest.redirectUri,
          state: webRequest.state,
          userAgent: requestMetadata.userAgent,
          userId: result.userId,
        }),
      };
    }

    // El flujo venia de Pulse Hub: en vez de ir al panel web, se devuelve el
    // resultado al escritorio. La sesion web queda igualmente abierta, que es
    // lo que el usuario espera si vuelve al navegador.
    if (desktopRequest && result.userId) {
      return {
        desktopHandoffUrl: await buildDesktopHandoffUrl({
          codeChallenge: desktopRequest.codeChallenge,
          ipAddress: requestMetadata.ip,
          state: desktopRequest.state,
          userAgent: requestMetadata.userAgent,
          userId: result.userId,
        }),
      };
    }

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
