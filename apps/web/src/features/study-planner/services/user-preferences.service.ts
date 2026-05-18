import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * UserPreferencesService
 *
 * Handles study preferences and calendar integrations.
 */

import { createClient } from '../../../lib/supabase/server';
import type {
  CalendarProvider,
  StudyPreferences,
  CalendarIntegration,
  SessionType,
  TimeOfDay,
} from '../types/user-context.types';

function mapTimeOfDay(value?: string | null): TimeOfDay {
  switch (value) {
    case 'afternoon':
    case 'evening':
    case 'night':
      return value;
    default:
      return 'morning';
  }
}

function mapSessionType(value?: string | null): SessionType {
  switch (value) {
    case 'short':
    case 'long':
      return value;
    default:
      return 'medium';
  }
}

function mapCalendarProvider(
  value?: string | null
): CalendarProvider | undefined {
  if (value === 'google' || value === 'microsoft') {
    return value;
  }

  return undefined;
}

function normalizeOptionalNumber(value?: number | null): number | undefined {
  return value ?? undefined;
}

function normalizeOptionalString(value?: string | null): string | undefined {
  return value ?? undefined;
}

export class UserPreferencesService {
  /**
   * Obtiene las preferencias de estudio del usuario
   */
  static async getStudyPreferences(
    userId: string
  ): Promise<StudyPreferences | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('study_preferences')
      .select('id, user_id, timezone, preferred_time_of_day, preferred_days, daily_target_minutes, weekly_target_minutes, preferred_session_type, min_session_minutes, max_session_minutes, break_duration_minutes, calendar_connected, calendar_provider')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      techDebtLogger.error('Error obteniendo preferencias de estudio:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      timezone: data.timezone,
      preferredTimeOfDay: mapTimeOfDay(data.preferred_time_of_day),
      preferredDays: data.preferred_days,
      dailyTargetMinutes: data.daily_target_minutes,
      weeklyTargetMinutes: data.weekly_target_minutes,
      preferredSessionType: mapSessionType(data.preferred_session_type),
      minSessionMinutes: normalizeOptionalNumber(data.min_session_minutes),
      maxSessionMinutes: normalizeOptionalNumber(data.max_session_minutes),
      breakDurationMinutes: normalizeOptionalNumber(data.break_duration_minutes),
      calendarConnected: data.calendar_connected || false,
      calendarProvider: mapCalendarProvider(data.calendar_provider),
    };
  }

  /**
   * Obtiene la integracion de calendario del usuario
   */
  static async getCalendarIntegration(
    userId: string
  ): Promise<CalendarIntegration | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('id, user_id, provider, access_token, expires_at, scope')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      techDebtLogger.error('Error obteniendo integracion de calendario:', error);
      return null;
    }

    const isConnected =
      !!data.access_token &&
      (!data.expires_at || new Date(data.expires_at) > new Date());

    return {
      id: data.id,
      userId: data.user_id,
      provider: mapCalendarProvider(data.provider) ?? 'google',
      isConnected,
      expiresAt: normalizeOptionalString(data.expires_at),
      scope: normalizeOptionalString(data.scope),
    };
  }
}
