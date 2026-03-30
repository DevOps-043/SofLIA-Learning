/**
 * CalendarAuthService
 *
 * OAuth flow management for Google and Microsoft calendar integrations:
 * - Auth URL generation
 * - Auth code exchange (connect)
 * - Token refresh
 * - OAuth error parsing
 */

import type { CalendarIntegration } from '../types/user-context.types';
import { CalendarDbService } from './calendar-db.service';
import { CalendarGoogleService } from './calendar-google.service';
import { CalendarMicrosoftService } from './calendar-microsoft.service';

// Configuración de OAuth - buscar en múltiples nombres de variables para compatibilidad
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_OAUTH_CLIENT_ID;

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.GOOGLE_OAUTH_CLIENT_SECRET;

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_OAUTH_CLIENT_ID;

const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_OAUTH_CLIENT_SECRET;

export const REDIRECT_URI = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/study-planner/calendar/callback';

export class CalendarAuthService {
  /**
   * Genera la URL de autorización para Google Calendar
   * Usa scopes completos para crear calendarios secundarios y consultar todos los calendarios
   */
  static getGoogleAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.settings.readonly',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ provider: 'google', userId }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Genera la URL de autorización para Microsoft Calendar
   */
  static getMicrosoftAuthUrl(userId: string): string {
    const scopes = [
      'offline_access',
      'Calendars.Read',
      'Calendars.ReadWrite',
      'User.Read',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: scopes,
      state: JSON.stringify({ provider: 'microsoft', userId }),
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Conecta Google Calendar usando el código de autorización
   * Verifica que el email del calendario coincida con el del usuario de la app
   */
  static async connectGoogleCalendar(userId: string, authCode: string, expectedEmail?: string): Promise<CalendarIntegration | null> {
    try {
      const redirectUri = REDIRECT_URI;

      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID || '',
          client_secret: GOOGLE_CLIENT_SECRET || '',
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'unknown_error', error_description: errorText };
        }
        console.error('[Calendar Integration] Error obteniendo tokens de Google:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorData,
          redirectUriUsed: redirectUri,
          clientIdUsed: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NO CONFIGURADO',
        });

        const errorMsg = this.parseGoogleOAuthError(errorData);
        throw new Error(errorMsg);
      }

      const tokens = await tokenResponse.json();

      // VERIFICACIÓN DE SEGURIDAD: Obtener el email del usuario del calendario
      const calendarUserEmail = await CalendarGoogleService.getGoogleUserEmail(tokens.access_token);

      if (calendarUserEmail) {
        if (expectedEmail && expectedEmail.toLowerCase() !== calendarUserEmail.toLowerCase()) {
          console.warn('[Calendar Integration] El email del calendario no coincide con el usuario de la app:', {
            emailApp: expectedEmail,
            emailCalendar: calendarUserEmail,
          });
          throw new Error(`EMAIL_MISMATCH: El calendario conectado pertenece a "${calendarUserEmail}" pero estás logueado como "${expectedEmail}". Por favor, inicia sesión en Google con la cuenta correcta o cierra la sesión de Google y vuelve a intentar.`);
        }
      }

      // Guardar en base de datos con el email del calendario
      const integration = await CalendarDbService.saveCalendarIntegration(userId, 'google', tokens, calendarUserEmail);

      // CREAR CALENDARIO SECUNDARIO: Al conectar por primera vez, crear el calendario de la plataforma
      if (integration) {
        const secondaryCalendarId = await CalendarGoogleService.getOrCreatePlatformCalendar(tokens.access_token);

        if (secondaryCalendarId) {
          await CalendarDbService.saveSecondaryCalendarId(userId, secondaryCalendarId);
        } else {
          console.warn('[Calendar Integration] No se pudo crear el calendario secundario, se usará el principal');
        }
      }

      return integration;

    } catch (error) {
      console.error('Error conectando Google Calendar:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error desconocido al conectar con Google Calendar');
    }
  }

  /**
   * Conecta Microsoft Calendar usando el código de autorización
   * Verifica que el email del calendario coincida con el del usuario de la app
   */
  static async connectMicrosoftCalendar(userId: string, authCode: string, expectedEmail?: string): Promise<CalendarIntegration | null> {
    try {
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID || '',
          client_secret: MICROSOFT_CLIENT_SECRET || '',
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
          scope: 'offline_access Calendars.Read Calendars.ReadWrite User.Read',
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Error obteniendo tokens de Microsoft:', await tokenResponse.text());
        return null;
      }

      const tokens = await tokenResponse.json();

      // VERIFICACIÓN DE SEGURIDAD: Obtener el email del usuario del calendario
      const calendarUserEmail = await CalendarMicrosoftService.getMicrosoftUserEmail(tokens.access_token);

      if (calendarUserEmail) {
        if (expectedEmail && expectedEmail.toLowerCase() !== calendarUserEmail.toLowerCase()) {
          console.warn('[Calendar Integration] El email del calendario Microsoft no coincide con el usuario de la app:', {
            emailApp: expectedEmail,
            emailCalendar: calendarUserEmail,
          });
          throw new Error(`EMAIL_MISMATCH: El calendario conectado pertenece a "${calendarUserEmail}" pero estás logueado como "${expectedEmail}". Por favor, inicia sesión en Microsoft con la cuenta correcta o cierra la sesión y vuelve a intentar.`);
        }
      }

      return await CalendarDbService.saveCalendarIntegration(userId, 'microsoft', tokens, calendarUserEmail);

    } catch (error) {
      console.error('Error conectando Microsoft Calendar:', error);
      if (error instanceof Error) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Refresca el token de acceso si está expirado
   * Usa Service Role Key para leer de la BD
   */
  static async refreshTokenIfNeeded(userId: string): Promise<string | null> {
    const integration = await CalendarDbService.getRawIntegration(userId);

    if (!integration) {
      return null;
    }

    // Verificar si el token está por expirar (menos de 5 minutos)
    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
    const needsRefresh = !expiresAt ||
      (expiresAt.getTime() - Date.now()) < 5 * 60 * 1000;

    if (!needsRefresh) {
      return integration.access_token;
    }

    if (!integration.refresh_token) {
      console.error('No hay refresh token disponible');
      return null;
    }

    let tokenUrl: string;
    let bodyParams: Record<string, string>;

    if (integration.provider === 'google') {
      tokenUrl = 'https://oauth2.googleapis.com/token';
      bodyParams = {
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      };
    } else {
      tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      bodyParams = {
        client_id: MICROSOFT_CLIENT_ID || '',
        client_secret: MICROSOFT_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
        scope: 'offline_access Calendars.Read Calendars.ReadWrite User.Read',
      };
    }

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(bodyParams),
      });

      if (!response.ok) {
        console.error('Error refrescando token:', await response.text());
        return null;
      }

      const tokens = await response.json();

      const newExpiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      // ✅ CORRECCIÓN: Guardar nuevo refresh_token si viene en la respuesta
      // Preservar el existente si no viene uno nuevo
      const refreshTokenToSave = tokens.refresh_token || integration.refresh_token;

      await CalendarDbService.updateTokens(
        integration.id,
        tokens.access_token,
        refreshTokenToSave,
        newExpiresAt
      );

      return tokens.access_token;

    } catch (error) {
      console.error('Error refrescando token:', error);
      return null;
    }
  }

  /**
   * Parsea errores de OAuth de Google y devuelve mensajes claros
   */
  static parseGoogleOAuthError(errorData: { error?: string; error_description?: string }): string {
    const error = errorData.error || '';
    const description = errorData.error_description || '';

    if (error === 'access_denied' || description.includes('access_denied')) {
      if (description.includes('test') || description.includes('Testing')) {
        return 'TEST_MODE_USER_NOT_ADDED: Tu email no está agregado como usuario de prueba. Ve a Google Cloud Console > OAuth consent screen > Test users y agrega tu email.';
      }
      return 'ACCESS_DENIED: Acceso denegado. Asegúrate de aceptar todos los permisos solicitados.';
    }

    if (description.includes("doesn't comply with Google's OAuth 2.0 policy") ||
      description.includes('OAuth 2.0 policy') ||
      description.includes('unverified') ||
      description.includes('validation rules')) {
      return 'APP_NOT_VERIFIED: Google rechazó la conexión por políticas de OAuth. Posibles causas:\n' +
        '1. Los cambios en Google Cloud Console pueden tardar 10-20 minutos en aplicarse\n' +
        '2. Verifica que el redirect URI en Credentials coincida EXACTAMENTE con: ' + REDIRECT_URI + '\n' +
        '3. Asegúrate de que tu email esté en usuarios de prueba y espera unos minutos\n' +
        '4. Si el problema persiste, intenta crear nuevas credenciales OAuth 2.0';
    }

    if (error === 'redirect_uri_mismatch' || description.includes('redirect_uri')) {
      return 'REDIRECT_URI_MISMATCH: La URI de redirección no coincide. Verifica que tengas configurado: ' + REDIRECT_URI + ' en Google Cloud Console > Credentials > OAuth 2.0 Client ID.';
    }

    if (error === 'invalid_client' || description.includes('client_id')) {
      return 'INVALID_CLIENT: El Client ID es inválido. Verifica tu configuración en Google Cloud Console.';
    }

    if (error === 'invalid_grant' || description.includes('expired')) {
      return 'CODE_EXPIRED: El código de autorización ha expirado. Por favor, intenta conectar de nuevo.';
    }

    return description || error || 'Error desconocido al conectar con Google Calendar';
  }
}
