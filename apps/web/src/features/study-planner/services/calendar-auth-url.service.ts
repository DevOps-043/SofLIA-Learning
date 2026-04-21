import {
  GOOGLE_CLIENT_ID,
  MICROSOFT_CLIENT_ID,
  REDIRECT_URI,
} from './calendar-auth.config';

export function getGoogleCalendarAuthUrl(userId: string): string {
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

export function getMicrosoftCalendarAuthUrl(userId: string): string {
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
