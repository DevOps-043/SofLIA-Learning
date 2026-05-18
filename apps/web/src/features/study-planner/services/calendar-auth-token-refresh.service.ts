import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
} from './calendar-auth.config';
import { logger } from '@/lib/logger';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
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
    logger.warn('No hay refresh token disponible');
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
    const response = await fetchWithCircuitBreaker('calendar-oauth', tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(bodyParams),
    });

    if (!response.ok) {
      logger.warn('Error refrescando token', { status: response.status, provider: integration.provider });
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
    logger.warn('Error refrescando token', { provider: integration.provider, error });
    return null;
  }
}
