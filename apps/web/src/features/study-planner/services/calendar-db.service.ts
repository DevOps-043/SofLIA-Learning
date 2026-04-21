/**
 * CalendarDbService
 *
 * Database operations for calendar integrations.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import {
  CALENDAR_INTEGRATION_PUBLIC_SELECT,
  CALENDAR_INTEGRATION_TOKEN_SELECT,
} from './calendar-db.constants';
import { saveCalendarIntegrationRecord } from './calendar-db-integration-save.service';
import {
  getSelectedCalendarIds,
  saveSelectedCalendarIds,
} from './calendar-db-selection.service';
import type { CalendarIntegration } from '../types/user-context.types';

export { createLegacyAdminClient } from './calendar-db-legacy-admin.service';

type CalendarProvider = 'google' | 'microsoft';

export class CalendarDbService {
  static async saveCalendarIntegration(
    userId: string,
    provider: 'google' | 'microsoft',
    tokens: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    },
    calendarEmail?: string | null,
  ): Promise<CalendarIntegration | null> {
    return saveCalendarIntegrationRecord(userId, provider, tokens, calendarEmail);
  }

  static async getCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select(CALENDAR_INTEGRATION_PUBLIC_SELECT)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const isConnected = !!data.access_token &&
      (!data.expires_at || new Date(data.expires_at) > new Date());

    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider as 'google' | 'microsoft',
      isConnected,
      expiresAt: data.expires_at || undefined,
      scope: data.scope || undefined,
    };
  }

  static async getRawIntegration(userId: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('calendar_integrations')
      .select(CALENDAR_INTEGRATION_TOKEN_SELECT)
      .eq('user_id', userId)
      .single();

    return data;
  }

  static async updateTokens(
    integrationId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: string | null,
  ): Promise<void> {
    const supabase = createAdminClient();

    await supabase
      .from('calendar_integrations')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId);
  }

  static async disconnectCalendar(userId: string, provider?: 'google' | 'microsoft'): Promise<boolean> {
    const supabase = createAdminClient();
    let query = supabase
      .from('calendar_integrations')
      .delete()
      .eq('user_id', userId);

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { error } = await query;

    if (error) {
      console.error('Error desconectando calendario:', error);
      return false;
    }

    return true;
  }

  static async saveSecondaryCalendarId(userId: string, calendarId: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('calendar_integrations')
      .update({
        metadata: { secondary_calendar_id: calendarId },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google');

    if (error) {
      console.error('[Calendar] Error guardando secondary_calendar_id:', error);
    }
  }

  static async getSecondaryCalendarId(userId: string): Promise<string | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('metadata')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (error || !data) {
      return null;
    }

    const metadata = data.metadata as { secondary_calendar_id?: string } | null;
    return metadata?.secondary_calendar_id || null;
  }

  static async getSelectedCalendarIds(
    userId: string,
    provider?: CalendarProvider,
  ): Promise<string[] | null> {
    return getSelectedCalendarIds(userId, provider);
  }

  static async saveSelectedCalendarIds(
    userId: string,
    calendarIds: string[],
    provider?: CalendarProvider,
  ): Promise<void> {
    return saveSelectedCalendarIds(userId, calendarIds, provider);
  }
}
