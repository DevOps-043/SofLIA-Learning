import {
  isValidCodeChallenge,
} from './desktop-sso';

/** Peticion SSO pendiente cuyo resultado debe volver a Project Hub. */
export const WEB_SSO_COOKIE_NAME = 'web_sso_request';

/** La peticion solo debe sobrevivir al viaje de ida y vuelta por OAuth. */
export const WEB_SSO_COOKIE_MAX_AGE_SECONDS = 15 * 60;

const LOCAL_PROJECT_HUB_CALLBACK =
  'http://localhost:3000/api/auth/callback/learning';
const PROJECT_HUB_CALLBACK_PATH = '/api/auth/callback/learning';

export interface WebSsoRequest {
  codeChallenge: string;
  redirectUri: string;
  state: string;
}

/**
 * Project Hub firma un payload opaco que puede contener `.` y superar los 128
 * caracteres. Learning no interpreta su formato: solo limita el tamano y
 * rechaza controles para que sea seguro conservarlo temporalmente.
 */
export function isValidWebSsoState(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 16 &&
    value.length <= 2_048 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function isSafeConfiguredCallback(value: string): boolean {
  try {
    const url = new URL(value);
    const isLocalDevelopmentCallback =
      process.env.NODE_ENV !== 'production' &&
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

    return (
      (url.protocol === 'https:' || isLocalDevelopmentCallback) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === PROJECT_HUB_CALLBACK_PATH &&
      url.toString() === value
    );
  } catch {
    return false;
  }
}

/**
 * Devuelve la lista blanca exacta de callbacks de Project Hub.
 *
 * En produccion no hay un valor implicito: el dominio final debe declararse
 * expresamente. En desarrollo se habilita unicamente el callback local que
 * forma parte del contrato entre ambos proyectos.
 */
export function getAllowedWebSsoRedirectUris(): ReadonlySet<string> {
  const configured = (process.env.PROJECT_HUB_SSO_REDIRECT_URIS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(isSafeConfiguredCallback);

  if (process.env.NODE_ENV !== 'production') {
    configured.push(LOCAL_PROJECT_HUB_CALLBACK);
  }

  return new Set(configured);
}

/** Coincidencia textual exacta; no se aceptan subdominios ni rutas parecidas. */
export function isAllowedWebSsoRedirectUri(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    getAllowedWebSsoRedirectUris().has(value)
  );
}

export function buildWebSsoCallbackUrl(
  redirectUri: string,
  ticket: string,
  state: string
): string {
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set('state', state);
  callbackUrl.searchParams.set('ticket', ticket);

  return callbackUrl.toString();
}

export function buildWebSsoErrorUrl(
  redirectUri: string,
  state: string,
  code: string
): string {
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set('state', state);
  callbackUrl.searchParams.set('error', code);

  return callbackUrl.toString();
}

export function serializeWebSsoRequest(request: WebSsoRequest): string {
  return JSON.stringify(request);
}

export function parseWebSsoRequest(cookieValue?: string): WebSsoRequest | null {
  if (!cookieValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(cookieValue) as Partial<WebSsoRequest>;

    if (
      !isValidWebSsoState(parsed.state) ||
      !isValidCodeChallenge(parsed.codeChallenge) ||
      !isAllowedWebSsoRedirectUri(parsed.redirectUri)
    ) {
      return null;
    }

    return {
      codeChallenge: parsed.codeChallenge,
      redirectUri: parsed.redirectUri,
      state: parsed.state,
    };
  } catch {
    return null;
  }
}
