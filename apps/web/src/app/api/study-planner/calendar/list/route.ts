import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';
import type { CalendarListItem, CalendarIntegrationMetadata } from '../../../../../features/study-planner/types/user-context.types';

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

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

/**
 * Refresca el token de acceso si ha expirado
 */
async function refreshAccessToken(integration: any): Promise<{ success: boolean; accessToken?: string }> {
  try {
    if (integration.provider === 'google') {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !integration.refresh_token) {
        return { success: false };
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) return { success: false };
      const tokens = await response.json();
      if (!tokens.access_token) return { success: false };

      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };

    } else if (integration.provider === 'microsoft') {
      if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !integration.refresh_token) {
        return { success: false };
      }

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
          scope: 'offline_access Calendars.Read User.Read',
        }),
      });

      if (!response.ok) return { success: false };
      const tokens = await response.json();
      if (!tokens.access_token) return { success: false };

      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };
    }

    return { success: false };
  } catch (error) {
    console.error('[Calendar List] Error refrescando token:', error);
    return { success: false };
  }
}

const PLATFORM_CALENDAR_NAME = 'SofLIA - Sesiones de Estudio';

/**
 * GET /api/study-planner/calendar/list
 * Retorna la lista de calendarios disponibles y la selección actual del usuario
 */
export async function GET() {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: integrations, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (integrationError || !integrations || integrations.length === 0) {
      return NextResponse.json({ error: 'No hay calendario conectado' }, { status: 404 });
    }

    const integration = integrations[0];
    let accessToken = integration.access_token;

    // Refresh token si expirado
    const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;
    const needsRefresh = !tokenExpiry || tokenExpiry <= new Date();

    if (needsRefresh) {
      if (!integration.refresh_token) {
        return NextResponse.json({
          error: 'Token expirado. Por favor, reconecta tu calendario.',
          requiresReconnection: true
        }, { status: 401 });
      }

      const refreshResult = await refreshAccessToken(integration);
      if (!refreshResult.success || !refreshResult.accessToken) {
        return NextResponse.json({
          error: 'No se pudo refrescar el token. Por favor, reconecta tu calendario.',
          requiresReconnection: true
        }, { status: 401 });
      }
      accessToken = refreshResult.accessToken;
    }

    const metadata = (integration.metadata || {}) as CalendarIntegrationMetadata;
    let calendars: CalendarListItem[] = [];

    if (integration.provider === 'google') {
      const googleCalendars = await CalendarIntegrationService.getGoogleCalendarList(accessToken!);

      calendars = googleCalendars
        // Filtrar el calendario de la plataforma SOFLIA
        .filter(cal => {
          const isSoflia = cal.summary.toLowerCase() === PLATFORM_CALENDAR_NAME.toLowerCase() ||
            cal.id === metadata.secondary_calendar_id;
          return !isSoflia;
        })
        .map(cal => ({
          id: cal.id,
          name: cal.summary,
          isPrimary: cal.primary,
          accessRole: cal.accessRole as CalendarListItem['accessRole'],
          color: cal.backgroundColor,
          provider: 'google' as const,
        }));
    } else if (integration.provider === 'microsoft') {
      const msCalendars = await CalendarIntegrationService.getMicrosoftCalendarList(accessToken!);

      calendars = msCalendars.map(cal => ({
        id: cal.id,
        name: cal.name,
        isPrimary: cal.isDefaultCalendar,
        accessRole: (cal.canEdit ? 'writer' : 'reader') as CalendarListItem['accessRole'],
        color: cal.color,
        provider: 'microsoft' as const,
      }));
    }

    // Determinar IDs seleccionados
    let selectedIds = metadata.selected_calendar_ids || null;

    if (!selectedIds) {
      // Default: solo el calendario principal
      const primaryCalendar = calendars.find(c => c.isPrimary);
      selectedIds = primaryCalendar ? [primaryCalendar.id] : (calendars.length > 0 ? [calendars[0].id] : []);
    } else {
      // Limpiar IDs stale (calendarios que ya no existen)
      const validIds = new Set(calendars.map(c => c.id));
      const cleanedIds = selectedIds.filter(id => validIds.has(id));

      if (cleanedIds.length !== selectedIds.length) {
        // Actualizar en DB para remover IDs stale
        await CalendarIntegrationService.saveSelectedCalendarIds(user.id, cleanedIds);
        selectedIds = cleanedIds;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        calendars,
        selectedIds,
        provider: integration.provider,
      }
    });

  } catch (error) {
    console.error('[Calendar List] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
