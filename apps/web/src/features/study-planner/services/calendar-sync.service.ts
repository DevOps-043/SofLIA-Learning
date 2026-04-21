import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { CalendarIntegrationService } from './calendar-integration.service';
import type { CalendarContext, SyncResult } from './calendar-sync.types';
import { syncDeleteGoogleEvent, syncCreateGoogleEvent, syncUpdateGoogleEvent } from './calendar-sync-google.service';
import { syncDeleteMicrosoftEvent, syncCreateMicrosoftEvent } from './calendar-sync-microsoft.service';

export type { CalendarContext, SyncResult, CalendarEventData, CalendarEventUpdateData } from './calendar-sync.types';

export function createLegacyAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variables de Supabase no configuradas');
  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export class CalendarSyncService {
  static async getCalendarContext(userId: string): Promise<CalendarContext | null> {
    const supabase = createAdminClient();
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('id, access_token, refresh_token, provider, expires_at, metadata')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!integration?.access_token) return null;

    const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
    let calendarId = metadata?.secondary_calendar_id || null;
    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
    let accessToken = integration.access_token;

    if (expiresAt && expiresAt <= new Date() && integration.refresh_token) {
      const refreshedToken = await CalendarIntegrationService.refreshTokenIfNeeded(userId);
      if (refreshedToken) {
        accessToken = refreshedToken;
      } else {
        console.error('[CalendarSync] Error refrescando token');
        return null;
      }
    }

    if (!calendarId && integration.provider === 'google' && accessToken) {
      calendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken);
      if (calendarId) {
        await supabase
          .from('calendar_integrations')
          .update({ metadata: { secondary_calendar_id: calendarId }, updated_at: new Date().toISOString() })
          .eq('id', integration.id);
      }
    }

    return { accessToken, provider: integration.provider as 'google' | 'microsoft', calendarId, userId };
  }

  static deleteGoogleEvent = syncDeleteGoogleEvent;
  static createGoogleEvent = syncCreateGoogleEvent;
  static updateGoogleEvent = syncUpdateGoogleEvent;
  static deleteMicrosoftEvent = syncDeleteMicrosoftEvent;
  static createMicrosoftEvent = syncCreateMicrosoftEvent;

  static async deleteSessionWithCalendarSync(sessionId: string): Promise<SyncResult> {
    const supabase = createAdminClient();
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('id, user_id, external_event_id, calendar_provider')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) return { success: false, error: 'Sesión no encontrada' };

    if (session.external_event_id && session.calendar_provider) {
      const context = await this.getCalendarContext(session.user_id);
      if (context) {
        if (session.calendar_provider === 'google') {
          const result = await syncDeleteGoogleEvent(context.accessToken, session.external_event_id, context.calendarId);
          if (!result.success) console.warn('[CalendarSync] No se pudo eliminar el evento externo:', result.error);
        } else if (session.calendar_provider === 'microsoft') {
          const result = await syncDeleteMicrosoftEvent(context.accessToken, session.external_event_id);
          if (!result.success) console.warn('[CalendarSync] No se pudo eliminar el evento de Microsoft:', result.error);
        }
      }
    }

    const { error: deleteError } = await supabase.from('study_sessions').delete().eq('id', sessionId);
    if (deleteError) return { success: false, error: `Error eliminando sesión: ${deleteError.message}` };
    return { success: true };
  }

  static async bulkDeleteSessionsWithCalendarSync(
    sessionIds: string[],
  ): Promise<{ success: boolean; deleted: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let deleted = 0;
    let failed = 0;

    for (const sessionId of sessionIds) {
      const result = await this.deleteSessionWithCalendarSync(sessionId);
      if (result.success) { deleted++; } else { failed++; if (result.error) errors.push(`${sessionId}: ${result.error}`); }
    }

    return { success: failed === 0, deleted, failed, errors };
  }
}
