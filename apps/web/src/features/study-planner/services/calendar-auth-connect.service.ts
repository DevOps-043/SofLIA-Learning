import type { CalendarIntegration } from '../types/user-context.types';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  REDIRECT_URI,
} from './calendar-auth.config';
import { parseGoogleOAuthError } from './calendar-auth-errors.service';
import { CalendarDbService } from './calendar-db.service';
import { CalendarGoogleService } from './calendar-google.service';
import { CalendarMicrosoftService } from './calendar-microsoft.service';

export async function connectGoogleCalendar(
  userId: string,
  authCode: string,
  expectedEmail?: string,
): Promise<CalendarIntegration | null> {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        code: authCode,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
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
        redirectUriUsed: REDIRECT_URI,
        clientIdUsed: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NO CONFIGURADO',
      });

      throw new Error(parseGoogleOAuthError(errorData));
    }

    const tokens = await tokenResponse.json();
    const calendarUserEmail = await CalendarGoogleService.getGoogleUserEmail(tokens.access_token);

    if (calendarUserEmail && expectedEmail && expectedEmail.toLowerCase() !== calendarUserEmail.toLowerCase()) {
      console.warn('[Calendar Integration] El email del calendario no coincide con el usuario de la app:', {
        emailApp: expectedEmail,
        emailCalendar: calendarUserEmail,
      });
      throw new Error(`EMAIL_MISMATCH: El calendario conectado pertenece a "${calendarUserEmail}" pero estÃ¡s logueado como "${expectedEmail}". Por favor, inicia sesiÃ³n en Google con la cuenta correcta o cierra la sesiÃ³n de Google y vuelve a intentar.`);
    }

    const integration = await CalendarDbService.saveCalendarIntegration(userId, 'google', tokens, calendarUserEmail);

    if (integration) {
      const secondaryCalendarId = await CalendarGoogleService.getOrCreatePlatformCalendar(tokens.access_token);

      if (secondaryCalendarId) {
        await CalendarDbService.saveSecondaryCalendarId(userId, secondaryCalendarId);
      } else {
        console.warn('[Calendar Integration] No se pudo crear el calendario secundario, se usarÃ¡ el principal');
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

export async function connectMicrosoftCalendar(
  userId: string,
  authCode: string,
  expectedEmail?: string,
): Promise<CalendarIntegration | null> {
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
    const calendarUserEmail = await CalendarMicrosoftService.getMicrosoftUserEmail(tokens.access_token);

    if (calendarUserEmail && expectedEmail && expectedEmail.toLowerCase() !== calendarUserEmail.toLowerCase()) {
      console.warn('[Calendar Integration] El email del calendario Microsoft no coincide con el usuario de la app:', {
        emailApp: expectedEmail,
        emailCalendar: calendarUserEmail,
      });
      throw new Error(`EMAIL_MISMATCH: El calendario conectado pertenece a "${calendarUserEmail}" pero estÃ¡s logueado como "${expectedEmail}". Por favor, inicia sesiÃ³n en Microsoft con la cuenta correcta o cierra la sesiÃ³n y vuelve a intentar.`);
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
