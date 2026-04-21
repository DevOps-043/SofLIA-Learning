/**
 * CalendarAuthService
 *
 * Facade for OAuth URL generation, provider connection, token refresh and
 * Google OAuth error parsing.
 */

import type { CalendarIntegration } from '../types/user-context.types';
import {
  connectGoogleCalendar,
  connectMicrosoftCalendar,
} from './calendar-auth-connect.service';
import { parseGoogleOAuthError } from './calendar-auth-errors.service';
import { refreshCalendarTokenIfNeeded } from './calendar-auth-token-refresh.service';
import {
  getGoogleCalendarAuthUrl,
  getMicrosoftCalendarAuthUrl,
} from './calendar-auth-url.service';

export { REDIRECT_URI } from './calendar-auth.config';

export class CalendarAuthService {
  static getGoogleAuthUrl(userId: string): string {
    return getGoogleCalendarAuthUrl(userId);
  }

  static getMicrosoftAuthUrl(userId: string): string {
    return getMicrosoftCalendarAuthUrl(userId);
  }

  static connectGoogleCalendar(
    userId: string,
    authCode: string,
    expectedEmail?: string,
  ): Promise<CalendarIntegration | null> {
    return connectGoogleCalendar(userId, authCode, expectedEmail);
  }

  static connectMicrosoftCalendar(
    userId: string,
    authCode: string,
    expectedEmail?: string,
  ): Promise<CalendarIntegration | null> {
    return connectMicrosoftCalendar(userId, authCode, expectedEmail);
  }

  static refreshTokenIfNeeded(userId: string): Promise<string | null> {
    return refreshCalendarTokenIfNeeded(userId);
  }

  static parseGoogleOAuthError(errorData: { error?: string; error_description?: string }): string {
    return parseGoogleOAuthError(errorData);
  }
}
