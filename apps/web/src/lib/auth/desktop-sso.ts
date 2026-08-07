import crypto from 'crypto';

/**
 * Puente entre el SSO web de Learning y el inicio de sesion de Pulse Hub.
 *
 * El escritorio no puede autenticar por contrasena a las cuentas creadas por
 * OAuth, porque nacen en `auth.users` sin contrasena. En vez de duplicar el SSO
 * alli, Learning termina su propio flujo y entrega al escritorio un ticket de
 * un solo uso que este canjea por una sesion Supabase legitima.
 *
 * El ticket vuelve al escritorio por el esquema `soflia://`, que en Windows
 * cualquier aplicacion local puede registrar. Por eso el ticket aislado no
 * sirve: el canje exige ademas el verificador que solo posee la instancia que
 * inicio el flujo (PKCE S256, RFC 8252).
 */

/** Cookie que marca que el flujo en curso proviene del escritorio. */
export const DESKTOP_SSO_COOKIE_NAME = 'desktop_sso_request';

/**
 * El ticket solo tiene que sobrevivir un redirect y una llamada inmediata.
 * Cuanto mas corta la ventana, menos vale interceptarlo.
 */
export const DESKTOP_SSO_TICKET_TTL_MS = 60_000;

/** La cookie muere con el intento: no debe sobrevivir a un flujo abandonado. */
export const DESKTOP_SSO_COOKIE_MAX_AGE_SECONDS = 15 * 60;

/**
 * Destino de retorno, FIJO en el servidor.
 *
 * No se acepta un destino enviado por el cliente en ningun parametro: seria
 * convertir este endpoint en un redirector abierto que exfiltra tickets.
 */
export const DESKTOP_SSO_CALLBACK_URL = 'soflia://auth/callback';

/** Longitud exacta de un SHA-256 en base64url, sin relleno. */
const S256_CHALLENGE_LENGTH = 43;

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export interface DesktopSsoRequest {
  codeChallenge: string;
  state: string;
}

export function generateDesktopSsoTicket(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Solo el hash se persiste; el valor en claro existe unicamente en transito. */
export function hashDesktopSsoTicket(ticket: string): string {
  return crypto.createHash('sha256').update(ticket).digest('hex');
}

export function deriveCodeChallenge(codeVerifier: string): string {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

/**
 * Compara en tiempo constante para no filtrar por medicion cuanto prefijo del
 * desafio se acerto.
 */
export function matchesCodeChallenge(
  codeVerifier: string,
  expectedChallenge: string
): boolean {
  const derived = Buffer.from(deriveCodeChallenge(codeVerifier));
  const expected = Buffer.from(expectedChallenge);

  if (derived.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(derived, expected);
}

export function isValidCodeChallenge(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === S256_CHALLENGE_LENGTH &&
    BASE64URL_PATTERN.test(value)
  );
}

/**
 * El `state` solo correlaciona la peticion con la respuesta en el escritorio;
 * aqui basta con acotarlo para que no sirva de vehiculo de inyeccion.
 */
export function isValidState(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 16 &&
    value.length <= 128 &&
    BASE64URL_PATTERN.test(value)
  );
}

export function isValidTicket(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export function isValidCodeVerifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 43 &&
    value.length <= 128 &&
    BASE64URL_PATTERN.test(value)
  );
}

export function buildDesktopCallbackUrl(ticket: string, state: string): string {
  const params = new URLSearchParams({ ticket, state });

  return `${DESKTOP_SSO_CALLBACK_URL}?${params.toString()}`;
}

/**
 * URL de retorno para un flujo que no pudo completarse. El escritorio la
 * distingue por el codigo y muestra su propio mensaje: no se le entrega texto
 * del servidor ni detalle de la causa.
 */
export function buildDesktopErrorUrl(state: string, code: string): string {
  const params = new URLSearchParams({ state, error: code });

  return `${DESKTOP_SSO_CALLBACK_URL}?${params.toString()}`;
}

export function serializeDesktopSsoRequest(request: DesktopSsoRequest): string {
  return JSON.stringify(request);
}

export function parseDesktopSsoRequest(
  cookieValue?: string
): DesktopSsoRequest | null {
  if (!cookieValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(cookieValue) as Partial<DesktopSsoRequest>;

    if (!isValidState(parsed.state) || !isValidCodeChallenge(parsed.codeChallenge)) {
      return null;
    }

    return { codeChallenge: parsed.codeChallenge, state: parsed.state };
  } catch {
    return null;
  }
}
