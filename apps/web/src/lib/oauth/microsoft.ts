const AUTH_BASE = 'https://login.microsoftonline.com';
const TENANT = process.env.MICROSOFT_TENANT_ID || 'common';

/**
 * Obtiene y normaliza la URI de redirección para Microsoft OAuth.
 * Asegura consistencia entre la generación de la URL de auth y el intercambio de tokens.
 */
export function getMicrosoftRedirectUri(): string {
  const redirectRaw = process.env.MICROSOFT_OAUTH_REDIRECT_URI || '';
  // Normalizar: quitar comillas, espacios y slash al final
  let redirectUri = redirectRaw.replace(/^['"]|['"]$/g, '').trim();

  // Quitar slash final si existe, ya que Azure AD es estricto con la coincidencia exacta
  if (redirectUri.endsWith('/')) {
    redirectUri = redirectUri.slice(0, -1);
  }

  // Validación básica
  if (!redirectUri || !/^https?:\/\/.+/i.test(redirectUri)) {
    // Si estamos en producción y la variable falla, fallback a la URL conocida del deploy
    // Esto salva el error si la variable de entorno se configuró mal (ej. falta https)
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[Microsoft OAuth] MICROSOFT_OAUTH_REDIRECT_URI inválida o faltante: "${redirectRaw}". Usando fallback de producción.`);
      return 'https://soflia.ai/auth/oauth/microsoft/callback';
    }

    throw new Error(
      `MICROSOFT_OAUTH_REDIRECT_URI no es una URL absoluta válida. Valor recibido: "${redirectRaw}". ` +
      `Ejemplo correcto: http://localhost:3000/auth/oauth/microsoft/callback`
    );
  }

  return redirectUri;
}

export function getMicrosoftAuthUrl(state: string) {
  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID!;
  const redirectUri = getMicrosoftRedirectUri();

  // Scopes v2: lista en texto plano; URLSearchParams se encarga de codificar.
  // No usar encodeURIComponent aquí para evitar doble codificación (%2520).
  const scope = 'openid profile offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Calendars.ReadWrite';

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    response_mode: 'query',
    redirect_uri: redirectUri,
    scope,
    state,
  });

  return `${AUTH_BASE}/${TENANT}/oauth2/v2.0/authorize?${params.toString()}`;
}


