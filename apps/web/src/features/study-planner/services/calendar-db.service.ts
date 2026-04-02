/**
 * CalendarDbService
 *
 * Database operations for calendar integrations:
 * save/get integration records, secondary calendar ID, selected calendar IDs.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '../../../lib/supabase/types';
import type {
  CalendarIntegration,
  CalendarIntegrationMetadata,
} from '../types/user-context.types';

const CALENDAR_INTEGRATION_PUBLIC_SELECT = `
  id,
  user_id,
  provider,
  access_token,
  expires_at,
  scope
`;

const CALENDAR_INTEGRATION_TOKEN_SELECT = `
  id,
  user_id,
  provider,
  access_token,
  refresh_token,
  expires_at,
  scope,
  metadata,
  updated_at
`;

/**
 * Crea un cliente de Supabase con Service Role Key para bypass de RLS
 * Útil para operaciones del servidor donde ya validamos la autenticación
 */
export function createLegacyAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada. Necesaria para operaciones del servidor.');
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export class CalendarDbService {
  /**
   * Guarda o actualiza la integración de calendario en la base de datos
   * Usa Service Role Key para bypass de RLS ya que este proyecto no usa Supabase Auth
   */
  static async saveCalendarIntegration(
    userId: string,
    provider: 'google' | 'microsoft',
    tokens: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    },
    calendarEmail?: string | null
  ): Promise<CalendarIntegration | null> {
    const supabase = createAdminClient();

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Verificar si ya existe una integración
    const { data: existing } = await supabase
      .from('calendar_integrations')
      .select('id, refresh_token')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    let result;

    if (existing) {
      // Actualizar existente
      // ✅ CORRECCIÓN: Preservar refresh_token existente si no viene uno nuevo
      // Google no siempre devuelve un nuevo refresh_token al refrescar,
      // por lo que debemos preservar el existente
      const refreshTokenToSave = tokens.refresh_token || existing.refresh_token;

      const { data, error } = await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: refreshTokenToSave,
          expires_at: expiresAt,
          scope: tokens.scope,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select(CALENDAR_INTEGRATION_PUBLIC_SELECT)
        .single();

      if (error) {
        console.error('Error actualizando integración:', error);

        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('RLS_ERROR: No tienes permisos para actualizar integraciones de calendario. Las políticas RLS están bloqueando la operación. Verifica las políticas de la tabla calendar_integrations en Supabase.');
        }

        throw error;
      }
      result = data;
    } else {
      // Crear nueva
      const { data, error } = await supabase
        .from('calendar_integrations')
        .insert({
          user_id: userId,
          provider,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope,
        })
        .select(CALENDAR_INTEGRATION_PUBLIC_SELECT)
        .single();

      if (error) {
        console.error('Error creando integración:', error);

        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('RLS_ERROR: No tienes permisos para crear integraciones de calendario. Las políticas RLS están bloqueando la operación. Verifica las políticas de la tabla calendar_integrations en Supabase.');
        }

        throw error;
      }
      result = data;
    }

    return {
      id: result.id,
      userId: result.user_id,
      provider: result.provider as 'google' | 'microsoft',
      isConnected: true,
      expiresAt: result.expires_at || undefined,
      scope: result.scope || undefined,
    };
  }

  /**
   * Obtiene la integración de calendario del usuario
   * Usa Service Role Key para leer de la BD
   */
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

  /**
   * Obtiene la fila completa de la integración del usuario (para operaciones de token)
   */
  static async getRawIntegration(userId: string) {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from('calendar_integrations')
      .select(CALENDAR_INTEGRATION_TOKEN_SELECT)
      .eq('user_id', userId)
      .single();

    return data;
  }

  /**
   * Actualiza los tokens en la BD después de un refresco
   */
  static async updateTokens(
    integrationId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: string | null
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

  /**
   * Desconecta el calendario del usuario
   * Usa Service Role Key para operaciones de BD
   */
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

  /**
   * Guarda el calendarId del calendario secundario en la integración del usuario
   */
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

  /**
   * Obtiene el calendarId del calendario secundario guardado en la BD
   */
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

  /**
   * Obtiene los IDs de calendarios seleccionados por el usuario desde metadata
   * Retorna null si no hay selección guardada (= usar default)
   */
  static async getSelectedCalendarIds(userId: string): Promise<string[] | null> {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('calendar_integrations')
        .select('metadata')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!data?.metadata) return null;
      const metadata = data.metadata as CalendarIntegrationMetadata;
      return metadata.selected_calendar_ids || null;
    } catch (error) {
      console.error('[Calendar] Error obteniendo calendarios seleccionados:', error);
      return null;
    }
  }

  /**
   * Guarda los IDs de calendarios seleccionados en metadata
   * Preserva campos existentes como secondary_calendar_id
   */
  static async saveSelectedCalendarIds(userId: string, calendarIds: string[]): Promise<void> {
    const supabase = createAdminClient();

    // Leer metadata existente para no sobreescribir otros campos
    const { data } = await supabase
      .from('calendar_integrations')
      .select('metadata')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const existingMetadata = (data?.metadata || {}) as CalendarIntegrationMetadata;

    await supabase
      .from('calendar_integrations')
      .update({
        metadata: {
          ...existingMetadata,
          selected_calendar_ids: calendarIds,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }
}
