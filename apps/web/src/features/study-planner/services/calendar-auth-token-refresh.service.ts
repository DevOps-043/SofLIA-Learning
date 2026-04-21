import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
} from './calendar-auth.config';
import { CalendarDbService } from './calendar-db.service';

export async function refreshCalendarTokenIfNeeded(userId: string): Promise<string | null> {
  const integration = await CalendarDbService.getRawIntegration(userId);

  if (!integration) {
    return null;
  }

  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
  const needsRefresh = !expiresAt || (expiresAt.getTime() - Date.now()) < 5 * 60 * 1000;

  if (!needsRefresh) {
    return integration.access_token;
  }

  if (!integration.refresh_token) {
    console.error('No hay refresh token disponible');
    return null;
  }

  const isGoogle = integration.provider === 'google';
  const tokenUrl = isGoogle
    ? 'https://oauth2.googleapis.com/token'
    : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  const bodyParams: Record<string, string> = isGoogle
    ? {
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }
    : {
        client_id: MICROSOFT_CLIENT_ID || '',
        client_secret: MICROSOFT_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
        scope: 'offline_access Calendars.Read Calendars.ReadWrite User.Read',
      };

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
    const refreshTokenToSave = tokens.refresh_token || integration.refresh_token;

    await CalendarDbService.updateTokens(
      integration.id,
      tokens.access_token,
      refreshTokenToSave,
      newExpiresAt,
    );

    return tokens.access_token;
  } catch (error) {
    console.error('Error refrescando token:', error);
    return null;
  }
}
